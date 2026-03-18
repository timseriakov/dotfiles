-- Copy content of text files to clipboard with path prefix
-- Usage: Alt+Y (or bind to any key)
-- Copies to both cb buffer "yz" (for history) and system clipboard

local M = {}

-- Get selected or hovered files (must be outside entry for ya.sync to work properly)
local selected_or_hovered = ya.sync(function()
	local tab = cx.active
	local paths = {}

	for _, u in pairs(tab.selected) do
		local path = tostring(u.url)
		if path and path ~= "" then
			paths[#paths + 1] = path
		end
	end

	if #paths == 0 and tab.current.hovered then
		local hover = tostring(tab.current.hovered.url)
		if hover and hover ~= "" then
			paths[1] = hover
		end
	end

	return paths
end)

-- Get the git root directory for the given path
local function get_git_root(cwd)
	local output = Command("git")
		:cwd(cwd)
		:args({ "rev-parse", "--show-toplevel" })
		:stdout(Command.PIPED)
		:stderr(Command.PIPED)
		:output()

	if output and output.status and output.status.success then
		return output.stdout:gsub("%s+$", "")
	end
	return nil
end

-- Get display path relative to git root, or with ~ for home
local function get_display_path(file_path, git_root)
	if git_root and file_path:find(git_root, 1, true) == 1 then
		return file_path:sub(#git_root + 2)
	end
	local home = os.getenv("HOME") or ""
	if home ~= "" and file_path:find(home, 1, true) == 1 then
		return "~" .. file_path:sub(#home + 1)
	end
	return file_path
end

-- Check if a file is a text file using mime type detection
local function is_text_file(path)
	local output = Command("file")
		:args({ "--mime-type", "-b", path })
		:stdout(Command.PIPED)
		:stderr(Command.PIPED)
		:output()

	if not output then
		return false
	end

	local mime = output.stdout:gsub("%s+$", ""):lower()
	if mime:find("^text/") then
		return true
	end

	local text_types = {
		["application/json"] = true,
		["application/javascript"] = true,
		["application/xml"] = true,
		["application/x-sh"] = true,
		["application/x-shellscript"] = true,
		["application/x-python"] = true,
		["application/x-ruby"] = true,
		["application/x-perl"] = true,
		["application/x-yaml"] = true,
		["application/yaml"] = true,
	}
	if text_types[mime] then
		return true
	end

	return false
end

-- Read file content
local function read_file(path)
	local file = io.open(path, "r")
	if not file then
		return nil
	end

	local content = file:read("*a")
	file:close()

	if not content then
		return ""
	end

	-- Remove trailing whitespace/newlines
	content = content:gsub("%s+$", "")
	return content
end

-- Main entry function
function M.entry()
	-- Escape visual mode first
	ya.manager_emit("escape", { visual = true })

	local urls = selected_or_hovered()
	if #urls == 0 then
		ya.notify({
			title = "Copy Content",
			content = "No file selected or hovered",
			level = "warn",
			timeout = 4,
		})
		return
	end

	-- Get git root for current directory
	local cwd = cx.active.current.cwd
	local git_root = get_git_root(tostring(cwd))

	local parts = {}
	local skipped = 0
	local count = 0

	for i, path in ipairs(urls) do
		if not is_text_file(path) then
			skipped = skipped + 1
		else
			local content = read_file(path)
			if content == nil then
				skipped = skipped + 1
			else
				local display_path = get_display_path(path, git_root)
				count = count + 1
				parts[#parts + 1] = string.format("=== %s ===\n%s", display_path, content)
			end
		end
	end

	if count == 0 then
		ya.notify({
			title = "Copy Content",
			content = "No text files to copy",
			level = "warn",
			timeout = 4,
		})
		return
	end
	local combined = table.concat(parts, "\n\n")

	-- Copy to system clipboard
	ya.clipboard(combined)

	-- Build notification message
	local msg = string.format("Copied %d file(s) to clipboard", count)
	if skipped > 0 then
		msg = msg .. string.format(" (%d skipped)", skipped)
	end

	ya.notify({
		title = "Copy Content",
		content = msg,
		level = "info",
		timeout = 3,
	})

end
return M
