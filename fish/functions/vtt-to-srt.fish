function vtt-to-srt
    for vtt_file in (find . -type f -iname '*.vtt')
        set srt_file (string replace -r '\.vtt$' '.srt' $vtt_file)

        echo " Converting $vtt_file → $srt_file"
        ffmpeg -loglevel error -y -i $vtt_file -c:s srt $srt_file

        if test $status -eq 0
            echo "✅ Done: $srt_file"
        else
            echo "❌ Failed: $vtt_file" >&2
        end
    end
end
