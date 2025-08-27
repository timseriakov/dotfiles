local externalScreenName = "LG FULL HD"
local resizeHeight = 890

-- apps to skip
local excludedApps = {
	["Simulator"] = true,
	["qemu-system-aarch64"] = true,
}

local function resizeIfOnExternal(win)
	if not win then
		return
	end

	local app = win:application()
	if app and excludedApps[app:name()] then
		-- skip resizing for excluded apps
		return
	end

	hs.timer.doAfter(0.1, function()
		local screen = win:screen()
		if not screen then
			return
		end

		if screen:name() == externalScreenName then
			local f = screen:frame()
			local target = hs.geometry.rect(f.x, f.y, f.w, resizeHeight)
			win:setFrame(target)
			print(
				string.format("[Resize] %s (%s) → %s", win:title() or "<no title>", app and app:name() or "?", target)
			)
		end
	end)
end

local wf = hs.window.filter.new(true)
wf:subscribe({ "windowMoved" }, resizeIfOnExternal)

hs.alert.show("Hammerspoon: auto-resize on LG enabled")
