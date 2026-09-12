#!/usr/bin/env bash
# Keep the cracked Raycast (Macked repack) from crash-looping.
#
# The Macked crack at Contents/Frameworks/macked.app.dylib (injected via a load command in
# SoulverCore.framework) serialises a nil object whenever one of its HTTP requests returns a
# non-JSON body (seen with 403s) and dies with
#   +[NSJSONSerialization dataWithJSONObject:options:error:]: value parameter is nil
# taking the whole app with it. macked-nilguard.m guards that single call site, then loads the
# original crack from macked-orig.dylib, so the crack itself keeps working.
#
# Usage: raycast/fix-macked-crash.sh [apply|restore]
# Re-run `apply` after any Raycast update — the updater replaces the bundle.
set -euo pipefail

APP=/Applications/Raycast.app
FW=$APP/Contents/Frameworks
BACKUP=$HOME/raycast-macked-backup
SRC=$(cd "$(dirname "$0")" && pwd)/macked-nilguard.m

build() {
	rm -rf /tmp/macked-nilguard && mkdir -p /tmp/macked-nilguard
	xcrun clang -dynamiclib -fobjc-arc -O2 -arch arm64 -arch x86_64 -framework Foundation \
		-Wl,-install_name,@rpath/macked.app.dylib -o /tmp/macked-nilguard/macked.app.dylib "$SRC"
	codesign -f -s - /tmp/macked-nilguard/macked.app.dylib
}

apply() {
	if [ ! -f "$FW/macked.app.dylib" ]; then
		echo "$FW/macked.app.dylib is missing — not a Macked repack any more, nothing to patch" >&2
		exit 1
	fi
	mkdir -p "$BACKUP"
	build
	if ! /usr/bin/grep -aq "\[nilguard\] armed" "$FW/macked.app.dylib"; then
		# What is installed is the real crack (fresh update, or the untouched original), so it
		# becomes the crack we load — otherwise a stale macked-orig.dylib would be reused.
		cp -p "$FW/macked.app.dylib" "$FW/macked-orig.dylib"
		cp -p "$FW/macked.app.dylib" "$BACKUP/macked.app.dylib.orig"
		echo "rotated the installed crack -> $FW/macked-orig.dylib and $BACKUP/macked.app.dylib.orig"
	fi
	if [ ! -f "$FW/macked-orig.dylib" ]; then
		echo "no crack to load (macked-orig.dylib missing), aborting" >&2
		exit 1
	fi
	cp /tmp/macked-nilguard/macked.app.dylib "$FW/macked.app.dylib"
	codesign -f -s - "$FW/macked.app.dylib"
	echo "installed nilguard shim; restart Raycast (pkill -x Raycast; open -a Raycast)"
	echo "verify: log show --last 3m --predicate 'process == \"Raycast\"' | grep nilguard"
}

restore() {
	orig=$FW/macked-orig.dylib
	[ -f "$orig" ] || orig=$BACKUP/macked.app.dylib.orig
	if [ ! -f "$orig" ]; then
		echo "no backup of the original crack found" >&2
		exit 1
	fi
	cp -p "$orig" "$FW/macked.app.dylib"
	echo "restored the original macked.app.dylib"
}

case "${1:-apply}" in
apply) apply ;;
restore) restore ;;
*)
	echo "usage: $0 [apply|restore]" >&2
	exit 2
	;;
esac
