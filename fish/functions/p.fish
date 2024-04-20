function P --wraps='fx package.json' --wraps='jless package.json' --description 'alias P jless package.json'
  jless package.json $argv
        
end
