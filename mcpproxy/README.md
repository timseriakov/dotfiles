# MCPProxy - Smart Proxy for AI Agents

MCPProxy is an open-source desktop application that super-charges AI agents with intelligent tool discovery, massive token savings, and built-in security quarantine against malicious MCP servers.

[![MCPProxy Demo](https://img.youtube.com/vi/l4hh6WOuSFM/0.jpg)](https://youtu.be/l4hh6WOuSFM)

[Visit mcpproxy.app](https://mcpproxy.app)

<div align="center">
  <a href="https://mcpproxy.app/images/menu_upstream_servers.png" target="_blank">
    <img src="https://mcpproxy.app/images/menu_upstream_servers.png" alt="System Tray - Upstream Servers" width="250" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://mcpproxy.app/images/menu_security_quarantine.png" target="_blank">
    <img src="https://mcpproxy.app/images/menu_security_quarantine.png" alt="System Tray - Quarantine Management" width="250" />
  </a>
  <br />
  <em>System Tray - Upstream Servers &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; System Tray - Quarantine Management</em>
</div>

## Why MCPProxy?

- Scale beyond API limits - federate hundreds of MCP servers while bypassing Cursor's 40-tool limit and OpenAI's 128-function cap.
- Save tokens and accelerate responses - agents load just one `retrieve_tools` function instead of hundreds of schemas; measured at roughly 99% token reduction with about 43% accuracy improvement.
- Advanced security protection - automatic quarantine blocks Tool Poisoning Attacks until you manually approve new servers.
- Works offline and cross-platform - native binaries for macOS (Intel and Apple Silicon), Windows (x64 and ARM64), and Linux (x64 and ARM64) with a system-tray UI.

---

## Quick Start

### 1. Install

**macOS (DMG installer recommended)**

Download the latest DMG installer for your architecture:

- Apple Silicon (M1/M2): [Download DMG](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest) -> `mcpproxy-*-darwin-arm64.dmg`
- Intel Mac: [Download DMG](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest) -> `mcpproxy-*-darwin-amd64.dmg`

**Windows (Installer)**

Download the latest Windows installer for your architecture:

- x64 (64-bit): [Download Installer](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest) -> `mcpproxy-setup-*-amd64.exe`
- ARM64: [Download Installer](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest) -> `mcpproxy-setup-*-arm64.exe`

Installers place both the core server and tray app on your PATH, create shortcuts, and support silent install: `.\mcpproxy-setup.exe /VERYSILENT`.

**Alternative install methods**

- macOS (Homebrew):
  ```bash
  brew install smart-mcp-proxy/mcpproxy/mcpproxy
  ```
- Manual download:
  - Linux: [AMD64](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest/download/mcpproxy-latest-linux-amd64.tar.gz) | [ARM64](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest/download/mcpproxy-latest-linux-arm64.tar.gz)
  - Windows: [AMD64](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest/download/mcpproxy-latest-windows-amd64.zip) | [ARM64](https://github.com/smart-mcp-proxy/mcpproxy-go/releases/latest/download/mcpproxy-latest-windows-arm64.zip)

**Prerelease builds (next branch)**

1. Open [GitHub Actions](https://github.com/smart-mcp-proxy/mcpproxy-go/actions) and select the latest successful "Prerelease" run.
2. Download the artifacts:
   - `dmg-darwin-arm64` (Apple Silicon)
   - `dmg-darwin-amd64` (Intel)
   - `versioned-linux-amd64`, `versioned-windows-amd64`

Prerelease builds are signed and notarized for macOS but may be unstable.

**Go install (requires Go 1.22+)**

```bash
go install github.com/smart-mcp-proxy/mcpproxy-go/cmd/mcpproxy@latest
```

### 2. Run

```bash
mcpproxy serve          # starts HTTP server on :8080 and shows tray
```

### 3. Add servers

Edit `~/.mcpproxy/mcp_config.json` (see minimal config below) or ask an LLM to add servers.

### 4. Connect to your IDE or AI tool

See the full setup guide in `docs/setup.md` on the website for Cursor, VS Code, Claude Desktop, and Goose.

---

## Add proxy to Cursor

### One-click install for Cursor

[![Install in Cursor IDE](https://img.shields.io/badge/Install_in_Cursor-3e44fe?logo=data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94P…&style=for-the-badge)](https://mcpproxy.app/cursor-install.html)

### Manual install

1. Open Cursor Settings.
2. Click "Tools and Integrations".
3. Add MCP server:
   ```json
   "MCPProxy": {
     "type": "http",
     "url": "http://localhost:8080/mcp/"
   }
   ```

---

## Minimal configuration (`~/.mcpproxy/mcp_config.json`)

```jsonc
{
  "listen": "127.0.0.1:8080",
  "data_dir": "~/.mcpproxy",
  "enable_tray": true,
  "top_k": 5,
  "tools_limit": 15,
  "tool_response_limit": 20000,
  "mcpServers": [
    {
      "name": "local-python",
      "command": "python",
      "args": ["-m", "my_server"],
      "protocol": "stdio",
      "enabled": true,
    },
    {
      "name": "remote-http",
      "url": "http://localhost:3001",
      "protocol": "http",
      "enabled": true,
    },
  ],
}
```

### Key parameters

| Field                   | Description                                        | Default          |
| ----------------------- | -------------------------------------------------- | ---------------- |
| listen                  | Address the proxy listens on                       | 127.0.0.1:8080   |
| data_dir                | Folder for config, DB, and logs                    | ~/.mcpproxy      |
| enable_tray             | Show native system-tray UI                         | true             |
| top_k                   | Tools returned by `retrieve_tools`                 | 5                |
| tools_limit             | Max tools returned to client                       | 15               |
| tool_response_limit     | Auto-truncate responses above N chars (0 disables) | 20000            |
| tls.enabled             | Enable HTTPS with local CA certificates            | false            |
| tls.require_client_cert | Enable mutual TLS (mTLS)                           | false            |
| tls.certs_dir           | Custom directory for TLS certificates              | {data_dir}/certs |
| tls.hsts                | Send HTTP Strict Transport Security headers        | true             |
| docker_isolation        | Docker security isolation settings                 | enabled: false   |

### CLI commands

Main commands:

```bash
mcpproxy serve                      # Start proxy server with system tray
mcpproxy tools list --server=NAME   # Debug tool discovery for a server
mcpproxy trust-cert                 # Install CA certificate as trusted (HTTPS)
```

Management:

```bash
mcpproxy upstream list              # List servers with status
mcpproxy upstream restart <name>    # Restart one server
mcpproxy upstream enable <name>     # Enable one server
mcpproxy upstream disable <name>    # Disable one server
mcpproxy upstream logs <name>       # View logs (--tail, --follow)
mcpproxy upstream restart --all     # Restart all
mcpproxy upstream enable --all      # Enable all
mcpproxy upstream disable --all     # Disable all
mcpproxy doctor                     # Health checks
```

Serve command flags (partial):

```text
mcpproxy serve --help
  -c, --config <file>              path to mcp_config.json
  -l, --listen <addr>              listen address for HTTP mode
  -d, --data-dir <dir>             custom data directory
      --log-level <level>          trace|debug|info|warn|error
      --log-to-file                enable logging to file
      --read-only                  enable read-only mode
      --disable-management         disable management features
      --allow-server-add           allow adding new servers (default true)
      --allow-server-remove        allow removing existing servers (default true)
      --enable-prompts             enable prompts for user input (default true)
      --tool-response-limit <num>  tool response limit in characters (0 = disabled)
```

Tools command flags (partial):

```text
mcpproxy tools list --help
  -s, --server <name>          upstream server name (required)
  -l, --log-level <level>      trace|debug|info|warn|error (default: info)
  -t, --timeout <duration>     connection timeout (default: 30s)
  -o, --output <format>        output format: table|json|yaml (default: table)
  -c, --config <file>          path to mcp_config.json
```

Debug examples:

```bash
# List tools with trace logging to see all JSON-RPC frames
mcpproxy tools list --server=github-server --log-level=trace

# List tools with custom timeout for slow servers
mcpproxy tools list --server=slow-server --timeout=60s

# Output tools in JSON format for scripting
mcpproxy tools list --server=weather-api --output=json
```

---

## Secrets management

MCPProxy uses the OS keyring to store API keys and credentials. Use `${keyring:secret_name}` placeholders in configs.

```bash
mcpproxy secrets set github_token            # interactive prompt
mcpproxy secrets set github_token "ghp..."  # from CLI (less secure)
mcpproxy secrets set github_token --from-env GITHUB_TOKEN
mcpproxy secrets list
mcpproxy secrets get github_token
mcpproxy secrets delete github_token
```

Example placeholder usage:

```jsonc
{
  "mcpServers": [
    {
      "name": "github-mcp",
      "command": "uvx",
      "args": ["mcp-server-github"],
      "protocol": "stdio",
      "env": {
        "GITHUB_TOKEN": "${keyring:github_token}",
        "OPENAI_API_KEY": "${keyring:openai_api_key}",
      },
      "enabled": true,
    },
  ],
}
```

Secrets are stored under the service name `mcpproxy` and shared across data directories.

---

## Docker security isolation

- Process isolation per MCP server in its own container.
- File system and optional network isolation.
- Resource limits (CPU and memory) and runtime detection.
- Git included in images for repository installs.

Example configuration:

```jsonc
{
  "docker_isolation": {
    "enabled": true,
    "memory_limit": "512m",
    "cpu_limit": "1.0",
    "timeout": "60s",
    "network_mode": "bridge",
    "default_images": {
      "python": "python:3.11",
      "uvx": "python:3.11",
      "node": "node:20",
      "npx": "node:20",
      "go": "golang:1.21-alpine",
    },
  },
}
```

---

## Docker recovery

- Detects Docker outages and reconnects automatically with exponential backoff.
- Sends native notifications for recovery events.
- Cleans up orphaned containers on shutdown.

Troubleshooting:

- Confirm Docker is running: `docker ps`
- Check logs: `cat ~/.mcpproxy/logs/main.log | grep -i "docker recovery"`
- Find managed containers: `docker ps -a --filter label=com.mcpproxy.managed=true`

---

## OAuth authentication support

- Automatic detection and configuration for most OAuth servers.
- PKCE by default, dynamic port allocation for callbacks, automatic token refresh.
- Dynamic client registration when possible.

Zero-config example:

```jsonc
{
  "mcpServers": [
    {
      "name": "runlayer-slack",
      "url": "https://oauth.runlayer.com/api/v1/proxy/YOUR-UUID/mcp",
    },
    {
      "name": "cloudflare_autorag",
      "url": "https://autorag.mcp.cloudflare.com/mcp",
      "protocol": "streamable-http",
    },
  ],
}
```

Explicit configuration example:

```jsonc
{
  "mcpServers": [
    {
      "name": "github-enterprise",
      "url": "https://github.example.com/mcp",
      "protocol": "http",
      "oauth": {
        "scopes": ["repo", "user:email", "read:org"],
        "pkce_enabled": true,
        "client_id": "your-registered-client-id",
        "extra_params": {
          "resource": "https://api.github.example.com",
          "audience": "github-enterprise-api",
        },
      },
    },
  ],
}
```

Diagnostics:

```bash
mcpproxy auth status --server=runlayer-slack
mcpproxy auth status --all
mcpproxy doctor
```

---

## Working directory configuration

Specify working directories for stdio MCP servers to isolate context:

```jsonc
{
  "mcpServers": [
    {
      "name": "ast-grep-project-a",
      "command": "npx",
      "args": ["ast-grep-mcp"],
      "working_dir": "/home/user/projects/project-a",
      "enabled": true,
    },
  ],
}
```

---

## Optional HTTPS setup

HTTP works by default. Enable HTTPS when needed:

```bash
export MCPPROXY_TLS_ENABLED=true
mcpproxy serve
```

Trust the certificate:

```bash
mcpproxy trust-cert
```

Use HTTPS URLs:

- MCP endpoint: `https://localhost:8080/mcp`
- Web UI: `https://localhost:8080/ui/`

Claude Desktop example with HTTPS:

```json
{
  "mcpServers": {
    "mcpproxy": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://localhost:8080/mcp"],
      "env": { "NODE_EXTRA_CA_CERTS": "~/.mcpproxy/certs/ca.pem" }
    }
  }
}
```

---

## Learn more

- Documentation: [Configuration](https://mcpproxy.app/docs/configuration), [Features](https://mcpproxy.app/docs/features), [Usage](https://mcpproxy.app/docs/usage)
- Website: <https://mcpproxy.app>
- Releases: <https://github.com/smart-mcp-proxy/mcpproxy-go/releases>

## Contributing

We welcome issues, feature ideas, and PRs. Fork the repo, create a feature branch, and open a pull request. See `CONTRIBUTING.md` (coming soon) for guidelines.
