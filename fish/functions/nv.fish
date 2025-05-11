function nv
    if test (count $argv) -gt 0
        set resolved (realpath $argv)
        open -n -a Neovide --args $resolved
    else
        open -n -a Neovide
    end
end
