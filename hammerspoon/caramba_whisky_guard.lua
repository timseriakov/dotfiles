---@diagnostic disable: undefined-global
local guard = {}

guard.whiskyBundleId = "com.isaacmarovitz.Whisky"
guard.carambaBundleId = "tech.caramba.switcher"
guard.watcher = nil
guard.retryTimer = nil
guard.whiskyRunning = false
guard.restoreCaramba = false
guard.englishLayout = "ABC"
guard.englishSourceId = "com.apple.keylayout.ABC"
guard.restoreMarker = "/tmp/caramba-whisky-guard-restore"

local function logInfo(message)
	print(string.format("[caramba-whisky-guard] %s", message))
end

local function isWhiskyRunning()
	return hs.application.get(guard.whiskyBundleId) ~= nil
end

local function switchToEnglish()
	if hs.keycodes.currentSourceID() == guard.englishSourceId then
		return
	end

	logInfo("Switching macOS input source to English")
	hs.keycodes.setLayout(guard.englishLayout)
end
local function setRestoreMarker(enabled)
	if enabled then
		local file = io.open(guard.restoreMarker, "w")
		if file then
			file:close()
		end
		return
	end
	os.remove(guard.restoreMarker)
end

local function shouldRestoreCaramba()
	local file = io.open(guard.restoreMarker, "r")
	if not file then
		return false
	end
	file:close()
	return true
end

local function getCaramba()
	return hs.application.get(guard.carambaBundleId)
end

function guard.sync()
	local whiskyRunning = isWhiskyRunning()
	if whiskyRunning then
		local caramba = getCaramba()
		if caramba then
			guard.restoreCaramba = true
			setRestoreMarker(true)
			switchToEnglish()
			logInfo("Stopping Caramba while Whisky is running")
			caramba:kill()
		end
		guard.whiskyRunning = true
		return
	end

	if shouldRestoreCaramba() then
		logInfo("Restoring Caramba after Whisky exits")
		hs.application.launchOrFocusByBundleID(guard.carambaBundleId)
		setRestoreMarker(false)
	end
	guard.whiskyRunning = false
	guard.restoreCaramba = false
end
local function scheduleSync()
	if guard.retryTimer then
		guard.retryTimer:stop()
	end
	guard.retryTimer = hs.timer.doAfter(0.5, function()
		guard.retryTimer = nil
		guard.sync()
	end)
end

function guard.init()
	if guard.watcher then
		guard.sync()
		return guard
	end

	guard.sync()
	scheduleSync()
	guard.watcher = hs.application.watcher.new(function()
		guard.sync()
		scheduleSync()
	end)
	guard.watcher:start()
	return guard
end

return guard
