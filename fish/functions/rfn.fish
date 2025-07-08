function rfn --description 'Remove node_modules and lockfiles if they exist'
    rm -rf node_modules
    set lockfiles *.lock
    if test (count $lockfiles) -gt 0
        rm -f $lockfiles
    end
end
