config = config
c = c

c.aliases = {
    "o": "open",
    "Q": "close",
    "w": "session-save",
    "x": "quit --save",
    "ms": "messages",
    "log": "messages",
    "l": "messages",
    "qq": "quit --save",  # Safe quit alias for intentional app exit
}

c.aliases.update(
    {
        "tor-start": "spawn -u tor-toggle start",
        "tor-stop": "spawn -u tor-toggle stop",
        "tor-status": "spawn -u tor-toggle status",
        "tor-toggle": "spawn -u tor-toggle toggle",
    }
)
