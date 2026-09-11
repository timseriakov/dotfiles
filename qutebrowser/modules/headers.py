config = config
c = c

config.set("content.site_specific_quirks.enabled", True)

# User agent (default for all sites)
config.set(
    "content.headers.user_agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/134.0.6998.208 Safari/537.36",
)

# Keep the explicit Google workaround: qutebrowser's built-in site quirk is
# initialized at startup and is not reliably reapplied by :config-source.
config.set(
    "content.headers.user_agent",
    "Mozilla/5.0 ({os_info}; rv:145.0) Gecko/20100101 Firefox/145.0",
    "https://accounts.google.com/*",
)
config.set(
    "content.headers.user_agent",
    "Mozilla/5.0 ({os_info}; rv:145.0) Gecko/20100101 Firefox/145.0",
    "https://accounts.youtube.com/*",
)
# Standard headers for all sites (навигационный профиль)
config.set("content.headers.accept_language", "en-US,en;q=0.9")

config.set("content.autoplay", False)
