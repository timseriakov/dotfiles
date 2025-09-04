#!/usr/bin/env fish
# Diagnostics helpers

# Quick diagnostics to verify Ruby/Bundler origins
function rbpaths --description "Print PATH and ruby/bundle origins"
    echo "=== PATH entries ==="
    printf "%s\n" $PATH
    echo
    echo "=== Origins ==="
    which -a ruby
    which -a gem
    which -a bundle
    echo
    ruby -v
    gem -v
    bundle -v
end
