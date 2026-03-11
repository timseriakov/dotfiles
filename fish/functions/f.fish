function f --wraps=z --wraps=zi --description 'alias f zi'
  set -lx SHELL sh
  zi $argv

end
