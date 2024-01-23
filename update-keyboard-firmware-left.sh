#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Update keyboard firmware [left]
# @raycast.mode compact

# Optional parameters:
# @raycast.icon ⌨️

# Documentation:
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov

base_dir="/Users/tim/Downloads/"
zip_name="firmware.zip"
zip_path="${base_dir}${zip_name}"

target_file="corne_left-nice_nano_v2-zmk.uf2"
destination="/Volumes/NICENANO"

if [ ! -f "$zip_path" ]; then
    echo "$zip_name not found"
    exit 1
fi

if [ ! -d "$destination" ]; then
    echo "Keyboard not connected."
    exit 1
fi

unzip -o "$zip_path" -d "$(dirname "$zip_path")"

result_file="$(dirname "$zip_path")/$target_file"

if [ ! -f "$result_file" ]; then
    result_file="$(dirname "$zip_path")/firmware/$target_file"
fi

if [ -f "$result_file" ]; then
    cp "$result_file" "$destination/"

    echo "Firmware updated."

    rm -f "$zip_path" "$result_file"
else
    echo "$target_file not found."

fi



