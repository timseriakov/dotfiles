function joshuto_interactive
    set ID (random)
    set OUTPUT_FILE "/tmp/$USER/joshuto-cwd-$ID"
    env joshuto --output-file "$OUTPUT_FILE" $argv ; or return
    if test -f $OUTPUT_FILE
        set JOSHUTO_CWD (string trim (cat "$OUTPUT_FILE"))
        if test -d "$JOSHUTO_CWD"
            cd "$JOSHUTO_CWD"
        end
    end
end
