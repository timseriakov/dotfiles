#!/usr/bin/env bash

## This script is a template script for creating textual file previews in Joshuto.
##
## Copy this script to your Joshuto configuration directory and refer to this
## script in `joshuto.toml` in the `[preview]` section like
## ```
## preview_script = "~/.config/joshuto/preview_file.sh"
## ```
## Make sure the file is marked as executable:
## ```sh
## chmod +x ~/.config/joshuto/preview_file.sh
## ```
## Joshuto will call this script for each file when first hovered by the cursor.
## If this script returns with an exit code 0, the stdout of this script will be
## the file's preview text in Joshuto's right panel.
## The preview text will be cached by Joshuto and only renewed on reload.
## ANSI color codes are supported if Joshuto is build with the `syntax_highlight`
## feature.
##
## This script is considered a configuration file and must be updated manually.
## It will be left untouched if you upgrade Joshuto.
##
## Meanings of exit codes:
##
## code | meaning    | action of ranger
## -----+------------+-------------------------------------------
## 0    | success    | Display stdout as preview
## 1    | no preview | Display no preview at all
##
## This script is used only as a provider for textual previews.
## Image previews are independent from this script.
##

IFS=$'\n'

# Security measures:
# * noclobber prevents you from overwriting a file with `>`
# * noglob prevents expansion of wild cards
# * nounset causes bash to fail if an undeclared variable is used (e.g. typos)
# * pipefail causes a pipeline to fail also if a command other than the last one fails
set -o noclobber -o noglob -o nounset -o pipefail

FILE_PATH=""
PREVIEW_WIDTH=10
PREVIEW_HEIGHT=10

while [ "$#" -gt 0 ]; do
  case "$1" in
  "--path")
    shift
    FILE_PATH="$1"
    ;;
  "--preview-width")
    shift
    PREVIEW_WIDTH="$1"
    ;;
  "--preview-height")
    shift
    PREVIEW_HEIGHT="$1"
    ;;
  esac
  shift
done

handle_extension() {
  case "${FILE_EXTENSION_LOWER}" in
  ## Archive
  a | ace | alz | arc | arj | bz | bz2 | cab | cpio | deb | gz | jar | lha | lz | lzh | lzma | lzo | \
    rpm | rz | t7z | tar | tbz | tbz2 | tgz | tlz | txz | tZ | tzo | war | xpi | xz | Z | zip)
    tar --list -- "${FILE_PATH}" && exit 0
    gtar --list --file "${FILE_PATH}" && exit 0
    exit 1
    ;;
  rar)
    unar -p- -- "${FILE_PATH}" && exit 0
    exit 1
    ;;
  7z)
    7zz l -p -- "${FILE_PATH}" && exit 0
    exit 1
    ;;
  pdf)
    pdftotext -l 10 -nopgbrk -q -- "${FILE_PATH}" - |
      fmt -w "${PREVIEW_WIDTH}" && exit 0
    exiftool "${FILE_PATH}" && exit 0
    exit 1
    ;;
  torrent)
    transmission-show -- "${FILE_PATH}" && exit 0
    exit 1
    ;;
  odt | sxw)
    pandoc -s -t markdown -- "${FILE_PATH}" && exit 0
    exit 1
    ;;
  ods | odp)
    exit 1
    ;;
  xlsx)
    exit 1
    ;;
  htm | html | xhtml)
    pandoc -s -t markdown -- "${FILE_PATH}" && exit 0
    ;;
  # htm|html|xhtml)
  #     w3m -dump "${FILE_PATH}" && exit 0
  #     ;;
  json | ipynb)
    jq --color-output . "${FILE_PATH}" && exit 0
    ;;
  dff | dsf | wv | wvc)
    exiftool "${FILE_PATH}" && exit 0
    ;;
  jpg | jpeg | png | gif | bmp)
    icat -- "${FILE_PATH}" && exit 0
    exit 1
    ;;
  md)
    glow -s dark "${FILE_PATH}" && exit 0
    exit 1
    ;;

  esac
}

handle_mime() {
  local mimetype="${1}"

  case "${mimetype}" in
  text/rtf | *msword)
    exit 1
    ;;
  *wordprocessingml.document | */epub+zip | */x-fictionbook+xml)
    pandoc -s -t markdown -- "${FILE_PATH}" | bat -l markdown \
      --color=always --paging=never \
      --style=plain \
      --terminal-width="${PREVIEW_WIDTH}" && exit 0
    exit 1
    ;;
  message/rfc822)
    exit 1
    ;;
  *ms-excel)
    exit 1
    ;;
  text/* | */xml)
    bat --color=always --decorations=never --paging=never \
      --style=plain \
      --terminal-width="${PREVIEW_WIDTH}" \
      "${FILE_PATH}" && exit 0
    cat "${FILE_PATH}" && exit 0
    exit 1
    ;;
  image/vnd.djvu)
    exiftool "${FILE_PATH}" && exit 0
    exit 1
    ;;
  image/*)
    exiftool "${FILE_PATH}" && exit 0
    exit 1
    ;;
  video/* | audio/*)
    exiftool "${FILE_PATH}" && exit 0
    exit 1
    ;;
  esac
}

FILE_EXTENSION="${FILE_PATH##*.}"
FILE_EXTENSION_LOWER="$(printf "%s" "${FILE_EXTENSION}" | tr '[:upper:]' '[:lower:]')"
handle_extension
MIMETYPE="$(file --dereference --brief --mime-type -- "${FILE_PATH}")"
handle_mime "${MIMETYPE}"

exit 1
