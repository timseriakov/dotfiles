local M = {}

local selected_or_hovered = ya.sync(function()
	local tab = cx.active
	local paths = {}

	for _, u in pairs(tab.selected) do
		local path = tostring(u)
		if path and path ~= "" then
			paths[#paths + 1] = path
		end
	end

	if #paths == 0 and tab.current.hovered then
		local hovered = tostring(tab.current.hovered.url)
		if hovered and hovered ~= "" then
			paths[1] = hovered
		end
	end

	return paths
end)

local function command_output(cmd, args, cwd)
	local command = Command(cmd):arg(args or {})
	if cwd and cwd ~= "" then
		command = command:cwd(cwd)
	end

	local output, err = command:output()
	if not output or err then
		return nil, err
	end

	return output.stdout or "", nil
end

local function get_git_root_for_dir(dir_path)
	local stdout = command_output("git", { "rev-parse", "--show-toplevel" }, dir_path)
	if not stdout then
		return nil
	end

	local root = stdout:gsub("%s+$", "")
	if root == "" then
		return nil
	end

	return root
end

local function get_display_path(file_path)
	local parent_dir = file_path:match("^(.*)/[^/]+$") or file_path
	local git_root = get_git_root_for_dir(parent_dir)

	if git_root and file_path:find(git_root, 1, true) == 1 then
		local rel = file_path:sub(#git_root + 2)
		if rel ~= "" then
			return rel
		end
	end

	local home = os.getenv("HOME") or ""
	if home ~= "" and file_path:find(home, 1, true) == 1 then
		return "~" .. file_path:sub(#home + 1)
	end

	return file_path
end

local function get_mime_type(path)
	local stdout = command_output("file", { "-b", "--mime-type", "--", path })
	if not stdout then
		stdout = command_output("file", { "-bI", "--", path })
	end
	if not stdout then
		return nil
	end

	local mime = stdout:gsub("%s+$", ""):match("^([^;]+)")
	if not mime then
		return nil
	end

	return mime:lower()
end

local function is_text_file(path)
	local mime = get_mime_type(path)
	if not mime then
		return false
	end

	if mime:find("^text/") then
		return true
	end

	local text_types = {
		["application/json"] = true,
		["application/javascript"] = true,
		["application/x-javascript"] = true,
		["application/xml"] = true,
		["application/yaml"] = true,
		["application/x-yaml"] = true,
		["application/toml"] = true,
		["application/x-toml"] = true,
		["application/x-sh"] = true,
		["application/x-shellscript"] = true,
		["application/x-python"] = true,
		["application/x-ruby"] = true,
		["application/x-perl"] = true,
		["application/x-lua"] = true,
		["application/sql"] = true,
		["image/svg+xml"] = true,
	}

	return text_types[mime] == true
end

local function read_file(path)
	local file, err = io.open(path, "rb")
	if not file then
		return nil, err
	end

	local content = file:read("*a")
	file:close()

	if content == nil then
		return nil, "failed to read file"
	end

	return content, nil
end

local function write_to_cb_yz(text)
	local child, err = Command("cb"):arg({ "copy_yz" }):stdin(Command.PIPED):spawn()

	if not child or err then
		return false
	end

	local ok_write, write_err = child:write_all(text)
	if not ok_write or write_err then
		return false
	end

	local ok_flush, flush_err = child:flush()
	if not ok_flush or flush_err then
		return false
	end

	local status, wait_err = child:wait()
	if not status or wait_err then
		return false
	end

	return status.success == true
end

function M:entry()
	local paths = selected_or_hovered()

	ya.emit("escape", { visual = true })

	if #paths == 0 then
		ya.notify({
			title = "Copy Content",
			content = "No file selected or hovered",
			level = "warn",
			timeout = 4,
		})
		return
	end

	local parts = {}
	local copied = 0
	local skipped = 0

	for _, path in ipairs(paths) do
		if is_text_file(path) then
			local content = read_file(path)
			if content ~= nil then
				local display_path = get_display_path(path)
				parts[#parts + 1] = string.format("=== %s ===\n%s", display_path, content)
				copied = copied + 1
			else
				skipped = skipped + 1
			end
		else
			skipped = skipped + 1
		end
	end

	if copied == 0 then
		ya.notify({
			title = "Copy Content",
			content = "No text files to copy",
			level = "warn",
			timeout = 4,
		})
		return
	end

	local combined = table.concat(parts, "\n\n\n")

	ya.clipboard(combined)

	local cb_ok = write_to_cb_yz(combined)

	local message = string.format("Copied %d file(s) to clipboard", copied)
	if skipped > 0 then
		message = message .. string.format(" (%d skipped)", skipped)
	end
	if cb_ok then
		message = message .. ", cb: yz"
	end

	ya.notify({
		title = "Copy Content",
		content = message,
		level = "info",
		timeout = 3,
	})
end

return M
