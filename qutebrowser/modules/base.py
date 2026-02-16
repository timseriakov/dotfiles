from time import localtime, strftime

leader = " "
ss_dir = "~/Documents/screenshots"
timestamp = strftime("%Y-%m-%d-%H-%M-%S", localtime())
terminal = "/opt/homebrew/bin/alacritty"
editor = "/opt/homebrew/bin/nvim"
username = "timseriakov"
homepage = "http://localhost:1931"


def en(cmd: str) -> str:
    return f"spawn -u switch-to-english ;; {cmd}"
