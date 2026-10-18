---@diagnostic disable: undefined-global
local guard = {}

guard.whiskyBundleId = "com.isaacmarovitz.Whisky"
guard.carambaBundleId = "tech.caramba.switcher"
guard.watcher = nil
guard.inWhisky = false
guard.restoreCaramba = false
guard.englishLayout = "ABC"
guard.englishSourceId = "com.apple.keylayout.ABC"

local function logInfo(message)
	print(string.format("[caramba-whisky-guard] %s", message))
end

local function frontmostBundleId()
	local app = hs.application.frontmostApplication()
	return app and app:bundleID() or nil
end

local function switchToEnglish()
	if hs.keycodes.currentSourceID() == guard.englishSourceId then
		return
	end

	logInfo("Switching macOS input source to English")
	hs.keycodes.setLayout(guard.englishLayout)
end
local function getCaramba()
	return hs.application.get(guard.carambaBundleId)
end

function guard.sync()
	local inWhisky = frontmostBundleId() == guard.whiskyBundleId
	if inWhisky == guard.inWhisky then
		return
	end

	guard.inWhisky = inWhisky
	if inWhisky then
		guard.restoreCaramba = getCaramba() ~= nil
		if guard.restoreCaramba then
			local caramba = getCaramba()
			if caramba then
				switchToEnglish()
				logInfo("Stopping Caramba while Whisky is frontmost")
				caramba:kill()
			end
		end
		return
	end

	if guard.restoreCaramba then
		logInfo("Restoring Caramba after leaving Whisky")
		hs.application.launchOrFocusByBundleID(guard.carambaBundleId)
	end
	guard.restoreCaramba = false
end

function guard.init()
	if guard.watcher then
		guard.sync()
		return guard
	end

	guard.sync()
	guard.watcher = hs.application.watcher.new(function()
		guard.sync()
	end)
	guard.watcher:start()
	return guard
end

return guard
