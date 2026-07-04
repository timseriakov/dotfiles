#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title UT2004
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🎯

# Documentation:
# @raycast.description Launch Unreal Tournament 2004 with OpenAL compatibility workaround
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov

env __ALSOFT_SUSPEND_CONTEXT=ignore /Applications/UT2004.app/Contents/MacOS/UT2004 >/dev/null 2>&1 &
