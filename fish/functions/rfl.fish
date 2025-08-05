function rfl --wraps='rf *.lock' --description 'alias rfl rf *.lock'
    set lockfiles *lock*
    if test (count $lockfiles) -gt 0
        rm -f $lockfiles
    end
end
