local function switch_to_abc()
	if ya.target_os() ~= "macos" then
		return
	end

	Command("im-select")
		:arg("com.apple.keylayout.ABC")
		:stdout(Command.NULL)
		:stderr(Command.NULL)
		:status()
end

return {
	entry = function()
		switch_to_abc()
	end,
}
