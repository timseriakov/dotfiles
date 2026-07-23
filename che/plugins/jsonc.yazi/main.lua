local M = {}

function M:peek(job)
	local child = Command("bat")
		:args({
			"--color=always",
			"--style=plain",
			"-l", "json",
			"--paging=never",
			tostring(job.file.url)
		})
		:stdout(Command.PIPED)
		:stderr(Command.PIPED)
		:spawn()

	if not child then
		return require("code").peek(job)
	end

	local limit = job.area.h
	local i, lines = 0, ""
	repeat
		local next, event = child:read_line()
		if event == 1 then
			break
		elseif event ~= 0 then
			break
		end

		i = i + 1
		if i > job.skip then
			lines = lines .. next
		end
	until i >= job.skip + limit

	child:start_kill()

	if i == 0 then
		return require("code").peek(job)
	end

	ya.preview_widgets(job, { ui.Text.parse(lines):area(job.area) })
end

function M:seek(job)
	require("code").seek(job)
end

return M
