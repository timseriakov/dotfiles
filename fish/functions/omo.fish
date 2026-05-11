function omo
    set -l args $argv

    # Если передана одна строка, начинающаяся с 'opencode ', чистим и разбиваем её
    if test (count $argv) -eq 1; and string match -qr '^opencode\s+' -- "$argv[1]"
        set -l tmp (string replace -r '^opencode\s+' '' -- "$argv[1]")
        set args (string split " " -- $tmp)
    end

    # Если первым аргументом идет слово 'opencode', просто убираем его
    if test (count $args) -gt 0; and test "$args[1]" = opencode
        set args $args[2..-1]
    end

    env OPENCODE_CONFIG_DIR="$HOME/dev/dotfiles/opencode/omo" opencode $args
end
