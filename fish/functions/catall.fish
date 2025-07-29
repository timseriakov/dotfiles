function catall --description 'Recursively cat all files with names and copy to clipboard'
    begin
        for f in (find . -type f)
            echo -e "\n===== $f ====="
            cat "$f"
        end
    end | tee /dev/tty | pbcopy
end
