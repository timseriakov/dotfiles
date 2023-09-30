function lhcss --wraps='postcss ./styles/*.pcss --dir ../_ares/build/css/ --ext css --verbose' --wraps='npx postcss ./styles/*.pcss --dir ../_ares/build/css/ --ext css --verbose' --wraps='cd /Users/lifetechteam/dev/lifecell/project/templates/lifecell/assets && npx postcss ./styles/*.pcss --dir ../_ares/build/css/ --ext css --verbose' --description 'alias lhcss cd /Users/lifetechteam/dev/lifecell/project/templates/lifecell/assets && npx postcss ./styles/*.pcss --dir ../_ares/build/css/ --ext css --verbose'
  cd /Users/lifetechteam/dev/lifecell/project/templates/lifecell/assets && npx postcss ./styles/*.pcss --dir ../_ares/build/css/ --ext css --verbose $argv
        
end
