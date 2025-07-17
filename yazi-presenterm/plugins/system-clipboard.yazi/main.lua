-- Meant to run at async context. (yazi system-clipboard)

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

return {
	entry = function()
		ya.manager_emit("escape", { visual = true })

		local urls = selected_or_hovered()
		if #urls == 0 then
			return ya.notify({
				title = "System Clipboard",
				content = "No file selected",
				level = "warn",
				timeout = 4,
			})
		end

		-- cb expects all arguments in one command
		local cmd = Command("cb"):arg("copy")
		for _, path in ipairs(urls) do
			cmd:arg(path)
		end

		local status, err = cmd:spawn():wait()

		if not status or not status.success then
			ya.notify({
				title = "System Clipboard",
				content = string.format("Could not copy file(s): %s", status and status.code or err),
				level = "error",
				timeout = 5,
			})
		end
	end,
}
