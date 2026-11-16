--- @since 26.8.15
-- model3d.yazi — превью 3D-моделей STL и 3MF в yazi.
-- model3d.yazi — STL and 3MF 3D model previews for yazi.
--
-- Картинку делает model3d-render (исходники в renderer/, сборка — build.sh):
--   * своя программа на Rust без сторонних библиотек;
--   * запускается в bubblewrap: без сети и без файловой системы (внутри только сам
--     бинарник), без новых user namespace; файл модели подаётся на stdin;
--   * под prlimit (3 ГиБ памяти, 60 с процессора) и nice 19, только для файла
--     под курсором — фоновой предзагрузки соседних файлов нет.
-- Если песочница не запустилась, превью не показывается (fail-closed).
-- Результат кэшируется в кэше yazi.
--
-- The image is made by model3d-render (sources in renderer/, built by build.sh):
-- a dependency-free Rust program run inside bubblewrap with no network and no
-- filesystem, under prlimit and nice, for the hovered file only. If the sandbox
-- cannot start, no preview is shown (fail-closed).

local M = {}

local MAX_FILE = 512 * 1024 * 1024 -- the renderer reads no more than this

local function data_home()
	local x = os.getenv("XDG_DATA_HOME")
	if x and x ~= "" then
		return x
	end
	return (os.getenv("HOME") or "") .. "/.local/share"
end

-- Outside the plugin directory on purpose: `ya pkg` treats extra files there as local changes.
local BIN = data_home() .. "/model3d.yazi/model3d-render"

-- Interface language: `--lang ru|en` in yazi.toml, otherwise from the locale.
local LOCALE_RU = (os.getenv("LC_ALL") or os.getenv("LC_MESSAGES") or os.getenv("LANG") or ""):match("^ru") ~= nil

local TEXTS = {
	ru = {
		mm = "мм",
		tris = "треуг.",
		thumb = "превью слайсера",
		unavailable = "Превью модели недоступно:",
		failed = "Не удалось построить превью",
		no_bin = "model3d: рендерер не найден:\n%s\nСоберите его: build.sh из репозитория (см. README).",
		bad_arg = "model3d: непонятный параметр в yazi.toml: %s",
		too_big = "файл больше %d МиБ",
		spawn = "model3d: не удалось запустить: %s",
		write = "model3d: не удалось записать кэш: %s",
		limits = "превышен лимит памяти или времени",
		sandbox = "model3d: песочница или рендерер не запустились (код %s)\n%s",
	},
	en = {
		mm = "mm",
		tris = "triangles",
		thumb = "slicer thumbnail",
		unavailable = "Model preview unavailable:",
		failed = "Could not build the preview",
		no_bin = "model3d: renderer not found:\n%s\nBuild it with build.sh from the repository (see README).",
		bad_arg = "model3d: unknown option in yazi.toml: %s",
		too_big = "file is larger than %d MiB",
		spawn = "model3d: could not start: %s",
		write = "model3d: could not write the cache: %s",
		limits = "memory or time limit exceeded",
		sandbox = "model3d: the sandbox or the renderer failed to start (code %s)\n%s",
	},
}
local DEFAULT_T = LOCALE_RU and TEXTS.ru or TEXTS.en

-- $1 — модель, $2 — рендерер, дальше его аргументы. Файл открывает sh снаружи
-- песочницы и отдаёт как stdin; пути не подставляются в текст скрипта.
-- $1 is the model, $2 the renderer, the rest are its arguments. sh opens the file
-- outside the sandbox and passes it as stdin; paths never become script text.
local SCRIPT = [[
f=$1; bin=$2; shift 2
ulimit -t 60 || exit 1
# macOS sandbox: no network or model-file access; the model arrives on stdin.
profile='(version 1) (deny default) (allow process*) (allow file-read*) (deny file-read* (subpath "/Users") (subpath "/private/tmp") (subpath "/Volumes")) (allow sysctl-read) (allow mach-lookup) (allow signal) (allow ipc*)'
exec nice -n 19 /usr/bin/sandbox-exec -p "$profile" "$bin" "$@" < "$f"
]]

-- Text shown in the pane may come from the file (e.g. a part name in an error):
-- keep printable characters only.
local function clean(s) return (tostring(s):gsub("[%c\127]", function(c) return c == "\n" and c or " " end)) end

local function message(job, text) ya.preview_widget(job, ui.Text(clean(text)):area(job.area):wrap(ui.Wrap.YES)) end

local function read_info(path)
	local fh = io.open(path, "r")
	if not fh then
		return nil
	end
	local s = fh:read("l")
	fh:close()
	return s
end

local function write_atomic(path, data)
	local tmp = Url(path .. ".part")
	local ok, err = fs.write(tmp, data)
	if ok then
		ok, err = fs.rename(tmp, Url(path))
	end
	if not ok then
		fs.remove("file", tmp)
	end
	return ok, err
end

local function num(s)
	local x = tonumber(s)
	if not x then
		return "?"
	end
	return (string.format("%.1f", x):gsub("%.0$", ""))
end

local function group(n)
	local s = tostring(math.floor(tonumber(n) or 0))
	return (s:reverse():gsub("(%d%d%d)", "%1 "):reverse():gsub("^ ", ""))
end

-- "OK render 60.00 30.00 40.00 36" → the caption under the image.
local function caption(info, T)
	local kind, x, y, z, t = info:match("^OK (%a+) (%S+) (%S+) (%S+) (%d+)")
	if not kind then
		return nil
	end
	local parts = {}
	if x ~= "?" then
		parts[#parts + 1] = string.format("%s × %s × %s %s", num(x), num(y), num(z), T.mm)
	end
	if tonumber(t) and tonumber(t) > 0 then
		parts[#parts + 1] = group(t) .. " " .. T.tris
	end
	if kind == "thumb" then
		parts[#parts + 1] = T.thumb
	end
	return table.concat(parts, "  ·  ")
end

local function djb2(s)
	local h = 5381
	for i = 1, #s do
		h = (h * 33 + s:byte(i)) % 4294967296
	end
	return string.format("%08x", h)
end

-- Renderer arguments and cache paths. Options are part of the cache file name,
-- so changing them in yazi.toml rebuilds the preview by itself.
local function plan(job)
	local cache = ya.file_cache(job)
	if not cache then
		return nil
	end
	local size = math.min(rt.preview.max_width, rt.preview.max_height, 2048)
	local argv = { "--size", tostring(size) }
	-- Everything after "--" in `run` arrives as one string: split it into words and
	-- pass known options only (this is argv, not a shell, so nothing is expanded).
	local allowed = { ["--no-thumbs"] = 0, ["--color"] = 1, ["--thumb-min"] = 1, ["--azimuth"] = 1, ["--elevation"] = 1 }
	local words = {}
	for _, a in ipairs(job.args or {}) do
		for w in tostring(a):gmatch("%S+") do
			words[#words + 1] = w
		end
	end
	local T = DEFAULT_T
	local i = 1
	while i <= #words do
		local n = allowed[words[i]]
		if words[i] == "--lang" and TEXTS[words[i + 1] or ""] then
			-- plugin-side option, not passed to the renderer
			T = TEXTS[words[i + 1]]
			i = i + 2
		elseif n == nil or i + n > #words then
			return nil, string.format(DEFAULT_T.bad_arg, words[i])
		else
			for k = i, i + n do
				argv[#argv + 1] = words[k]
			end
			i = i + n + 1
		end
	end
	local base = tostring(cache) .. "-m3d" .. djb2(table.concat(argv, " "))
	return { img = Url(base .. ".png"), info = base .. ".info", argv = argv, t = T }
end

function M:peek(job)
	local start = os.clock()
	local ok, err = self:preload(job)
	if not ok then
		return message(job, err or DEFAULT_T.failed)
	end
	local p = plan(job)
	if not p then
		return
	end
	local T = p.t
	local info = read_info(p.info) or ""
	if info:sub(1, 4) == "ERR " then
		-- "@key" is a message of the plugin itself, the rest comes from the renderer
		local why = info:sub(5)
		local key = why:match("^@(%w+)$")
		if key == "too_big" then
			why = string.format(T.too_big, MAX_FILE // 1048576)
		elseif key then
			why = T[key] or why
		end
		return message(job, T.unavailable .. "\n" .. why)
	end

	ya.sleep(math.max(0, rt.preview.image_delay / 1000 + start - os.clock()))
	local cap = caption(info, T)
	local rect, serr = ya.image_show(p.img, job.area)
	if serr then
		return ya.preview_widget(job, serr)
	end
	if cap and rect then
		-- Two rows under the image: the caption wraps in a narrow pane.
		local y = math.min(rect.y + rect.h, job.area.y + job.area.h - 2)
		ya.preview_widget(job, {
			ui.Text(cap)
				:area(ui.Rect { x = job.area.x, y = y, w = job.area.w, h = 2 })
				:align(ui.Align.CENTER)
				:wrap(ui.Wrap.YES),
		})
	end
end

function M:seek() end

-- Builds the preview into the cache. true: the cache holds an image or a remembered
-- error; false + text: the run itself failed (not cached, retried next time).
function M:preload(job)
	local p, perr = plan(job)
	if not p then
		return perr == nil, perr
	end
	local T = p.t
	if fs.cha(p.img) or read_info(p.info) then
		return true
	end

	local len = job.file.cha.len or 0
	if len > MAX_FILE then
		write_atomic(p.info, "ERR @too_big\n")
		return true
	end
	if not fs.cha(Url(BIN)) then
		return false, string.format(T.no_bin, BIN)
	end

	local args = { "-c", SCRIPT, "sh", tostring(job.file.path), BIN }
	for _, a in ipairs(p.argv) do
		args[#args + 1] = a
	end
	local out, err = Command("sh"):arg(args):stdout(Command.PIPED):stderr(Command.PIPED):output()
	if not out then
		return false, string.format(T.spawn, tostring(err))
	end

	local status = out.stderr:match("(OK [^\n]*)") or out.stderr:match("(ERR [^\n]*)") or ""
	if out.status.success and status:sub(1, 3) == "OK " and out.stdout:sub(1, 8) == "\137PNG\r\n\26\n" then
		local ok, werr = write_atomic(tostring(p.img), out.stdout)
		if not ok then
			return false, string.format(T.write, tostring(werr))
		end
		write_atomic(p.info, status .. "\n")
		return true
	end

	-- The renderer's own verdict (broken file, limits) is remembered so the same file
	-- is not parsed again on every hover. A failure to start is not remembered.
	if status:sub(1, 4) == "ERR " then
		write_atomic(p.info, clean(status) .. "\n")
		return true
	end
	local code = out.status.code
	if code == nil or code == 134 or code == 137 or code == 152 then
		-- killed by a signal: memory (134, abort) or CPU time (137/152) limit
		write_atomic(p.info, "ERR @limits\n")
		return true
	end
	local msg = out.stderr:gsub("%s+$", "")
	return false, string.format(T.sandbox, tostring(code), msg:sub(1, 400))
end

return M
