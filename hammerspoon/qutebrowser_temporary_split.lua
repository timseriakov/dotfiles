---@diagnostic disable: undefined-global
local temporarySplit = {}

temporarySplit.activeFile = "/tmp/qutebrowser-temporary-split-active"
temporarySplit.stateFile = "/tmp/qutebrowser-temporary-split-state.json"
temporarySplit.qutebrowserBundleId = "org.qutebrowser.qutebrowser"
temporarySplit.qutebrowserAppName = "qutebrowser"
temporarySplit.hotkeyModifiers = { "ctrl", "alt" }
temporarySplit.leftHotkey = "h"
temporarySplit.rightHotkey = "l"
temporarySplit.startTimeoutSeconds = 1.5
temporarySplit.promptDelaySeconds = 0.15
temporarySplit.layouts = {
	left = { x = 0, y = 0, w = 0.5, h = 1 },
	right = { x = 0.5, y = 0, w = 0.5, h = 1 },
	full = { x = 0, y = 0, w = 1, h = 1 },
}
temporarySplit.hotkeys = {}
temporarySplit.session = nil
temporarySplit.windowFilter = hs.window.filter.new("qutebrowser")
temporarySplit.watchersStarted = false
temporarySplit.urlHandlerBound = false
temporarySplit.startTimeout = nil

local function readFile(path)
	local file = io.open(path, "r")
	if not file then
		return nil
	end

	local content = file:read("*a")
	file:close()
	return content
end

local function writeFile(path, content)
	local file = io.open(path, "w")
	if not file then
		return false
	end

	file:write(content)
	file:close()
	return true
end

local function fileExists(path)
	local file = io.open(path, "r")
	if not file then
		return false
	end

	file:close()
	return true
end

local function removeFile(path)
	os.remove(path)
end

local function logInfo(message)
	print(string.format("[qutebrowser-temporary-split] %s", message))
end

local function alertAndLog(message)
	logInfo(message)
	hs.alert.show(message)
end

local function parseWindowId(raw)
	local value = tonumber(raw)
	if value == nil or value <= 0 then
		return nil
	end
	return math.tointeger(value)
end

local function nowIso()
	return os.date("!%Y-%m-%dT%H:%M:%SZ")
end

local function decodeState(raw)
	if not raw or raw == "" then
		return nil
	end

	local ok, data = pcall(hs.json.decode, raw)
	if not ok or type(data) ~= "table" then
		return nil
	end

	return data
end

local function normalizeSessionState(value)
	if value == "idle" or value == "awaiting_window" or value == "active" then
		return value
	end
	return "idle"
end

local function normalizeStateData(data)
	if type(data) ~= "table" then
		return nil
	end

	return {
		state = normalizeSessionState(data.state),
		sourceWindowId = parseWindowId(data.sourceWindowId),
		leftWindowId = parseWindowId(data.leftWindowId),
		rightWindowId = parseWindowId(data.rightWindowId),
		screenName = type(data.screenName) == "string" and data.screenName or "",
		startedAt = type(data.startedAt) == "string" and data.startedAt or "",
		lastAction = type(data.lastAction) == "string" and data.lastAction or "idle",
	}
end

local function encodeState(data)
	return {
		state = normalizeSessionState(data.state),
		sourceWindowId = data.sourceWindowId or 0,
		leftWindowId = data.leftWindowId or 0,
		rightWindowId = data.rightWindowId or 0,
		screenName = data.screenName or "",
		startedAt = data.startedAt or "",
		lastAction = data.lastAction or "idle",
	}
end

local function idleSession(lastAction, previous)
	return {
		state = "idle",
		sourceWindowId = nil,
		leftWindowId = nil,
		rightWindowId = nil,
		screenName = previous and previous.screenName or "",
		startedAt = previous and previous.startedAt or "",
		lastAction = lastAction or "idle",
	}
end

local function writeActiveSentinel(session)
	local marker = session.startedAt ~= "" and session.startedAt or tostring(session.sourceWindowId or session.leftWindowId or "active")
	return writeFile(temporarySplit.activeFile, marker .. "\n")
end

local function clearPendingStartTimeout()
	if temporarySplit.startTimeout then
		temporarySplit.startTimeout:stop()
		temporarySplit.startTimeout = nil
	end
end

local function persistSession(session)
	local normalized = normalizeStateData(session)
	if not normalized then
		return false
	end

	local encoded = hs.json.encode(encodeState(normalized), true)
	if not encoded then
		return false
	end

	if not writeFile(temporarySplit.stateFile, encoded .. "\n") then
		return false
	end

	if not writeActiveSentinel(normalized) then
		return false
	end

	temporarySplit.session = normalized
	return true
end

local function clearSessionFiles(lastAction, previous)
	clearPendingStartTimeout()
	removeFile(temporarySplit.activeFile)
	removeFile(temporarySplit.stateFile)
	temporarySplit.session = idleSession(lastAction, previous)
end

local function getWindowById(windowId)
	if not windowId then
		return nil
	end
	return hs.window.get(windowId)
end

local function loadState()
	local normalized = normalizeStateData(decodeState(readFile(temporarySplit.stateFile)))
	if not normalized then
		temporarySplit.session = idleSession("idle")
		return temporarySplit.session
	end

	if (normalized.state == "awaiting_window" or normalized.state == "active") and not fileExists(temporarySplit.activeFile) then
		clearSessionFiles("stale_session_cleared", normalized)
		return temporarySplit.session
	end

	if normalized.state == "awaiting_window" and not getWindowById(normalized.leftWindowId or normalized.sourceWindowId) then
		clearSessionFiles("source_window_missing", normalized)
		return temporarySplit.session
	end

	if normalized.state == "active" then
		if not getWindowById(normalized.leftWindowId) or not getWindowById(normalized.rightWindowId) then
			clearSessionFiles("stale_session_cleared", normalized)
			return temporarySplit.session
		end
	end

	temporarySplit.session = normalized
	return normalized
end

local function getQutebrowserApplication()
	local app = hs.application.get(temporarySplit.qutebrowserBundleId)
	if app then
		return app
	end
	return hs.appfinder.appFromName(temporarySplit.qutebrowserAppName)
end

local function isQutebrowserWindow(win)
	if not win then
		return false
	end

	local app = win:application()
	if not app then
		return false
	end

	return app:bundleID() == temporarySplit.qutebrowserBundleId or app:name() == temporarySplit.qutebrowserAppName
end

local function isStandardWindow(win)
	if not win then
		return false
	end

	local ok, standard = pcall(function()
		return win:isStandard()
	end)
	if not ok then
		return true
	end
	return standard == true
end

local function getFocusedQutebrowserWindow()
	local frontmostWindow = hs.window.frontmostWindow()
	if isQutebrowserWindow(frontmostWindow) then
		return frontmostWindow
	end

	local app = getQutebrowserApplication()
	if not app then
		return nil
	end

	local focusedWindow = app:focusedWindow()
	if isQutebrowserWindow(focusedWindow) then
		return focusedWindow
	end

	local mainWindow = app:mainWindow()
	if isQutebrowserWindow(mainWindow) then
		return mainWindow
	end

	return nil
end

local function getScreenName(screen)
	if not screen then
		return ""
	end
	return screen:name() or ""
end

local function getScreenByName(name)
	if not name or name == "" then
		return nil
	end
	return hs.screen.find(name)
end

local function setWindowLayout(win, layout, targetScreen)
	if not win then
		return false
	end

	if targetScreen and win:screen() and win:screen():id() ~= targetScreen:id() then
		win:moveToScreen(targetScreen)
	end

	win:moveToUnit(layout)
	return true
end

local function focusWindow(windowId)
	local win = getWindowById(windowId)
	if win then
		win:focus()
	end
end

local function restoreSurvivor(windowId, lastAction, previous)
	local survivor = getWindowById(windowId)
	local targetScreen = getScreenByName(previous and previous.screenName or "")
	if survivor then
		setWindowLayout(survivor, temporarySplit.layouts.full, targetScreen or survivor:screen())
		survivor:focus()
	end
	clearSessionFiles(lastAction, previous)
end

local function handleTrackedWindowClosed(closedWindowId)
	local session = temporarySplit.session or loadState()
	if not session or session.state ~= "active" then
		return
	end

	if closedWindowId == session.leftWindowId then
		restoreSurvivor(session.rightWindowId, "restored_right", session)
	elseif closedWindowId == session.rightWindowId then
		restoreSurvivor(session.leftWindowId, "restored_left", session)
	end
end

local function focusRightWindowForOpen(rightWindowId)
	hs.timer.doAfter(temporarySplit.promptDelaySeconds, function()
		local session = temporarySplit.session or loadState()
		if not session or session.state ~= "active" or session.rightWindowId ~= rightWindowId then
			return
		end

		local rightWindow = getWindowById(rightWindowId)
		if not rightWindow then
			alertAndLog("Temporary split cancelled: right window missing")
			clearSessionFiles("right_window_missing", session)
			return
		end

		rightWindow:focus()
		local app = rightWindow:application()
		if app then
			hs.eventtap.keyStroke({}, "o", 0, app)
		else
			hs.eventtap.keyStroke({}, "o", 0)
		end

		session.lastAction = "right_prompt_requested"
		persistSession(session)
	end)
end

local function pairRightWindow(rightWindow)
	local session = temporarySplit.session or loadState()
	if not session or session.state ~= "awaiting_window" then
		return
	end

	if not isQutebrowserWindow(rightWindow) or not isStandardWindow(rightWindow) then
		return
	end

	local rightWindowId = rightWindow:id()
	if not rightWindowId or rightWindowId == session.leftWindowId then
		return
	end

	local leftWindow = getWindowById(session.leftWindowId or session.sourceWindowId)
	if not leftWindow then
		alertAndLog("Temporary split cancelled: source window missing")
		clearSessionFiles("source_window_missing", session)
		return
	end

	clearPendingStartTimeout()
	session.rightWindowId = rightWindowId
	session.lastAction = "right_window_detected"
	if not persistSession(session) then
		alertAndLog("Temporary split failed: unable to persist detected right window")
		clearSessionFiles("state_write_failed", session)
		return
	end

	local targetScreen = getScreenByName(session.screenName) or leftWindow:screen() or rightWindow:screen()
	session.screenName = getScreenName(targetScreen)
	setWindowLayout(leftWindow, temporarySplit.layouts.left, targetScreen)
	setWindowLayout(rightWindow, temporarySplit.layouts.right, targetScreen)

	session.state = "active"
	session.leftWindowId = leftWindow:id()
	session.lastAction = "pair_activated"
	if not persistSession(session) then
		alertAndLog("Temporary split failed: unable to persist active pair state")
		clearSessionFiles("state_write_failed", session)
		return
	end

	focusRightWindowForOpen(rightWindowId)
end

local function bindHotkeys()
	if temporarySplit.hotkeys.left then
		return
	end

	temporarySplit.hotkeys.left = hs.hotkey.bind(temporarySplit.hotkeyModifiers, temporarySplit.leftHotkey, function()
		local session = temporarySplit.session or loadState()
		if session and session.state == "active" and session.leftWindowId then
			focusWindow(session.leftWindowId)
		end
	end)

	temporarySplit.hotkeys.right = hs.hotkey.bind(temporarySplit.hotkeyModifiers, temporarySplit.rightHotkey, function()
		local session = temporarySplit.session or loadState()
		if session and session.state == "active" and session.rightWindowId then
			focusWindow(session.rightWindowId)
		end
	end)
end

local function startWatcher()
	if temporarySplit.watchersStarted then
		return
	end

	temporarySplit.windowFilter:subscribe("windowCreated", function(win)
		if win then
			pairRightWindow(win)
		end
	end)

	temporarySplit.windowFilter:subscribe("windowDestroyed", function(win)
		if win then
			handleTrackedWindowClosed(win:id())
		end
	end)

	temporarySplit.watchersStarted = true
end

function temporarySplit.handleStart()
	local session = temporarySplit.session or loadState()
	if session and (session.state == "awaiting_window" or session.state == "active") then
		logInfo("Temporary split start ignored: session already in progress")
		return
	end

	local sourceWindow = getFocusedQutebrowserWindow()
	if not sourceWindow then
		alertAndLog("Temporary split failed: no focused qutebrowser window")
		clearSessionFiles("start_failed", session)
		return
	end

	local sourceScreen = sourceWindow:screen()
	local sessionState = {
		state = "awaiting_window",
		sourceWindowId = sourceWindow:id(),
		leftWindowId = sourceWindow:id(),
		rightWindowId = nil,
		screenName = getScreenName(sourceScreen),
		startedAt = nowIso(),
		lastAction = "session_started",
	}

	if not persistSession(sessionState) then
		alertAndLog("Temporary split failed: unable to persist session state")
		clearSessionFiles("state_write_failed", sessionState)
		return
	end

	clearPendingStartTimeout()
	local startedAt = sessionState.startedAt
	temporarySplit.startTimeout = hs.timer.doAfter(temporarySplit.startTimeoutSeconds, function()
		local currentSession = temporarySplit.session or loadState()
		if currentSession and currentSession.state == "awaiting_window" and currentSession.startedAt == startedAt then
			alertAndLog("Temporary split timed out waiting for the second window")
			clearSessionFiles("timeout_cleanup", currentSession)
		end
	end)
end

function temporarySplit.init()
	bindHotkeys()
	startWatcher()
	loadState()
end

if not temporarySplit.urlHandlerBound then
	hs.urlevent.bind("qutebrowser-temporary-split-start", function()
		temporarySplit.handleStart()
	end)
	temporarySplit.urlHandlerBound = true
end

return temporarySplit
