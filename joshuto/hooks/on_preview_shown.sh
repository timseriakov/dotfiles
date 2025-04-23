#!/usr/bin/env bash

TMP_FILE="$HOME/.cache/joshuto/thumbcache.png"

file="$1"
X="$2"
Y="$3"
width="$4"
height="$5"

function image {
  kitty +kitten icat --transfer-mode=file --clear 2>/dev/null
  kitty +kitten icat --transfer-mode=file --place "${width}x${height}@${X}x${Y}" "$1" 2>/dev/null
}

case $(file -b --mime-type "${file}") in
image/*)
  image "${file}"
  ;;
application/pdf)
  pdftoppm -png -f 1 -singlefile "${file}" "${TMP_FILE%.png}"
  image "${TMP_FILE}"
  ;;
video/*)
  ffmpegthumbnailer -i "${file}" -o "${TMP_FILE}" -s 0
  image "${TMP_FILE}"
  ;;
esac

exit 0
