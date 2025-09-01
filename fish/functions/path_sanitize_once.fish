function path_sanitize_once --description "Clean legacy Ruby 2.6 bins and conflicting env vars; ensure rbenv shims come first"
    # --- Configuration (bad/legacy PATH entries to remove)
    set -l BAD ~/.gem/ruby/2.6.0/bin '{cargo_bin}' /opt/homebrew/bin/bin

    # --- Clean current fish_user_paths from BAD and duplicates
    set -l cleaned
    set -l seen
    for p in $fish_user_paths
        if not contains -- $p $BAD
            if not contains -- $p $seen
                set cleaned $cleaned $p
                set seen $seen $p
            end
        end
    end

    # --- Force rbenv shims first in fish_user_paths
    set -U fish_user_paths ~/.rbenv/shims ~/.rbenv/bin $cleaned

    # --- Remove leftover user gem bin for Ruby 2.6 (avoid accidental execution)
    test -e ~/.gem/ruby/2.6.0/bin/bundle; and rm ~/.gem/ruby/2.6.0/bin/bundle
    test -d ~/.gem/ruby/2.6.0; and rm -rf ~/.gem/ruby/2.6.0

    # --- Clear env vars that may hijack gem/bundle paths
    set -e GEM_HOME
    set -e GEM_PATH
    set -e BUNDLE_PATH
    set -e BUNDLE_BIN
    set -e RUBYOPT

    # --- Rebuild rbenv shims (if available) and print a hint
    if type -q rbenv
        rbenv rehash
    end

    echo "PATH sanitized. Run: exec fish && rbpaths"
end
