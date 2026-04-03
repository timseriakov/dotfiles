# Print an optspec for argparse to handle cmd's options that are independent of any subcommand.
function __fish_zeroclaw_global_optspecs
	string join \n config-dir= h/help V/version
end

function __fish_zeroclaw_needs_command
	# Figure out if the current invocation already has a command.
	set -l cmd (commandline -opc)
	set -e cmd[1]
	argparse -s (__fish_zeroclaw_global_optspecs) -- $cmd 2>/dev/null
	or return
	if set -q argv[1]
		# Also print the command, so this can be used to figure out what it is.
		echo $argv[1]
		return 1
	end
	return 0
end

function __fish_zeroclaw_using_subcommand
	set -l cmd (__fish_zeroclaw_needs_command)
	test -z "$cmd"
	and return 1
	contains -- $cmd[1] $argv
end

complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -s V -l version -d 'Print version'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "onboard" -d 'Initialize your workspace and configuration'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "agent" -d 'Start the AI agent loop'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "gateway" -d 'Start/manage the gateway server (webhooks, websockets)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "acp" -d 'Start ACP (Agent Control Protocol) server over stdio'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "daemon" -d 'Start long-running autonomous runtime (gateway + channels + heartbeat + scheduler)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "service" -d 'Manage OS service lifecycle (launchd/systemd user service)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "doctor" -d 'Run diagnostics for daemon/scheduler/channel freshness'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "status" -d 'Show system status (full details)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "estop" -d 'Engage, inspect, and resume emergency-stop states'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "cron" -d 'Configure and manage scheduled tasks'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "models" -d 'Manage provider model catalogs'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "providers" -d 'List supported AI providers'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "channel" -d 'Manage channels (telegram, discord, slack)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "integrations" -d 'Browse 50+ integrations'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "skills" -d 'Manage skills (user-defined capabilities)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "migrate" -d 'Migrate data from other agent runtimes'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "auth" -d 'Manage provider subscription authentication profiles'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "hardware" -d 'Discover and introspect USB hardware'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "peripheral" -d 'Manage hardware peripherals (STM32, RPi GPIO, etc.)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "memory" -d 'Manage agent memory (list, get, stats, clear)'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "config" -d 'Manage configuration'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "update" -d 'Check for and apply updates'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "self-test" -d 'Run diagnostic self-tests'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "completions" -d 'Generate shell completion script to stdout'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "desktop" -d 'Launch or install the companion desktop app'
complete -c zeroclaw -n "__fish_zeroclaw_needs_command" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l api-key -d 'API key for provider configuration' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l provider -d 'Provider name (used in quick mode, default: openrouter)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l model -d 'Model ID override (used in quick mode)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l memory -d 'Memory backend (sqlite, lucid, markdown, none) - used in quick mode, default: sqlite' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l force -d 'Overwrite existing config without confirmation'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l reinit -d 'Reinitialize from scratch (backup and reset all configuration)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l channels-only -d 'Reconfigure channels only (fast repair flow)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -l quick -d 'Skip interactive prompts and use quick setup with defaults'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand onboard" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -s m -l message -d 'Single message mode (don\'t enter interactive mode)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -l session-state-file -d 'Load and save interactive session state in this JSON file' -r -F
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -s p -l provider -d 'Provider to use (openrouter, anthropic, openai, openai-codex)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -l model -d 'Model to use' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -s t -l temperature -d 'Temperature (0.0 - 2.0, defaults to config default_temperature)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -l peripheral -d 'Attach a peripheral (board:path, e.g. nucleo-f401re:/dev/ttyACM0)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand agent" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and not __fish_seen_subcommand_from start restart get-paircode help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and not __fish_seen_subcommand_from start restart get-paircode help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and not __fish_seen_subcommand_from start restart get-paircode help" -f -a "start" -d 'Start the gateway server (default if no subcommand specified)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and not __fish_seen_subcommand_from start restart get-paircode help" -f -a "restart" -d 'Restart the gateway server'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and not __fish_seen_subcommand_from start restart get-paircode help" -f -a "get-paircode" -d 'Show or generate the pairing code without restarting'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and not __fish_seen_subcommand_from start restart get-paircode help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from start" -s p -l port -d 'Port to listen on (use 0 for random available port); defaults to config gateway.port' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from start" -l host -d 'Host to bind to; defaults to config gateway.host Note: Binding to 0.0.0.0 requires `gateway.allow_public_bind = true` in config' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from start" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from start" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from restart" -s p -l port -d 'Port to listen on (use 0 for random available port); defaults to config gateway.port' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from restart" -l host -d 'Host to bind to; defaults to config gateway.host Note: Binding to 0.0.0.0 requires `gateway.allow_public_bind = true` in config' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from restart" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from restart" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from get-paircode" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from get-paircode" -l new -d 'Generate a new pairing code (even if already paired)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from get-paircode" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from help" -f -a "start" -d 'Start the gateway server (default if no subcommand specified)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from help" -f -a "restart" -d 'Restart the gateway server'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from help" -f -a "get-paircode" -d 'Show or generate the pairing code without restarting'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand gateway; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand acp" -l max-sessions -d 'Maximum concurrent sessions (default: 10)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand acp" -l session-timeout -d 'Session inactivity timeout in seconds (default: 3600)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand acp" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand acp" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand daemon" -s p -l port -d 'Port to listen on (use 0 for random available port); defaults to config gateway.port' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand daemon" -l host -d 'Host to bind to; defaults to config gateway.host' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand daemon" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand daemon" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -l service-init -d 'Init system to use: auto (detect), systemd, or openrc' -r -f -a "auto\t''
systemd\t''
openrc\t''"
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "install" -d 'Install daemon service unit for auto-start and restart'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "start" -d 'Start daemon service'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "stop" -d 'Stop daemon service'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "restart" -d 'Restart daemon service to apply latest config'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "status" -d 'Check daemon service status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "uninstall" -d 'Uninstall daemon service unit'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "logs" -d 'Tail daemon service logs'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and not __fish_seen_subcommand_from install start stop restart status uninstall logs help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from install" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from install" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from start" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from start" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from stop" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from stop" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from restart" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from restart" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from status" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from status" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from uninstall" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from uninstall" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from logs" -s n -l lines -d 'Number of lines to show (default: 50)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from logs" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from logs" -s f -l follow -d 'Follow log output (like tail -f)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from logs" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "install" -d 'Install daemon service unit for auto-start and restart'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "start" -d 'Start daemon service'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "stop" -d 'Stop daemon service'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "restart" -d 'Restart daemon service to apply latest config'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "status" -d 'Check daemon service status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "uninstall" -d 'Uninstall daemon service unit'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "logs" -d 'Tail daemon service logs'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand service; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and not __fish_seen_subcommand_from models traces help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and not __fish_seen_subcommand_from models traces help" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and not __fish_seen_subcommand_from models traces help" -f -a "models" -d 'Probe model catalogs across providers and report availability'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and not __fish_seen_subcommand_from models traces help" -f -a "traces" -d 'Query runtime trace events (tool diagnostics and model replies)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and not __fish_seen_subcommand_from models traces help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from models" -l provider -d 'Probe a specific provider only (default: all known providers)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from models" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from models" -l use-cache -d 'Prefer cached catalogs when available (skip forced live refresh)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from models" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from traces" -l id -d 'Show a specific trace event by id' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from traces" -l event -d 'Filter list output by event type' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from traces" -l contains -d 'Case-insensitive text match across message/payload' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from traces" -l limit -d 'Maximum number of events to display' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from traces" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from traces" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from help" -f -a "models" -d 'Probe model catalogs across providers and report availability'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from help" -f -a "traces" -d 'Query runtime trace events (tool diagnostics and model replies)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand doctor; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand status" -l format -d 'Output format: "exit-code" exits 0 if healthy, 1 otherwise (for Docker HEALTHCHECK)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand status" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand status" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -l level -d 'Level used when engaging estop from `zeroclaw estop`' -r -f -a "kill-all\t''
network-kill\t''
domain-block\t''
tool-freeze\t''"
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -l domain -d 'Domain pattern(s) for `domain-block` (repeatable)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -l tool -d 'Tool name(s) for `tool-freeze` (repeatable)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -f -a "status" -d 'Print current estop status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -f -a "resume" -d 'Resume from an engaged estop level'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and not __fish_seen_subcommand_from status resume help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from status" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from status" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from resume" -l domain -d 'Resume one or more blocked domain patterns' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from resume" -l tool -d 'Resume one or more frozen tools' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from resume" -l otp -d 'OTP code. If omitted and OTP is required, a prompt is shown' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from resume" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from resume" -l network -d 'Resume only network kill'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from resume" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from help" -f -a "status" -d 'Print current estop status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from help" -f -a "resume" -d 'Resume from an engaged estop level'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand estop; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "list" -d 'List all scheduled tasks'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "add" -d 'Add a new scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "add-at" -d 'Add a one-shot scheduled task at an RFC3339 timestamp'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "add-every" -d 'Add a fixed-interval scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "once" -d 'Add a one-shot delayed task (e.g. "30m", "2h", "1d")'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "remove" -d 'Remove a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "update" -d 'Update a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "pause" -d 'Pause a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "resume" -d 'Resume a paused task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and not __fish_seen_subcommand_from list add add-at add-every once remove update pause resume help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from list" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from list" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add" -l tz -d 'Optional IANA timezone (e.g. America/Los_Angeles)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add" -l allowed-tool -d 'Restrict agent cron jobs to the specified tool names (repeatable, agent-only)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add" -l agent -d 'Treat the argument as an agent prompt instead of a shell command'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-at" -l allowed-tool -d 'Restrict agent cron jobs to the specified tool names (repeatable, agent-only)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-at" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-at" -l agent -d 'Treat the argument as an agent prompt instead of a shell command'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-at" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-every" -l allowed-tool -d 'Restrict agent cron jobs to the specified tool names (repeatable, agent-only)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-every" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-every" -l agent -d 'Treat the argument as an agent prompt instead of a shell command'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from add-every" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from once" -l allowed-tool -d 'Restrict agent cron jobs to the specified tool names (repeatable, agent-only)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from once" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from once" -l agent -d 'Treat the argument as an agent prompt instead of a shell command'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from once" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from remove" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from remove" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from update" -l expression -d 'New cron expression' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from update" -l tz -d 'New IANA timezone' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from update" -l command -d 'New command to run' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from update" -l name -d 'New job name' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from update" -l allowed-tool -d 'Replace the agent job allowlist with the specified tool names (repeatable)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from update" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from update" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from pause" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from pause" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from resume" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from resume" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "list" -d 'List all scheduled tasks'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "add" -d 'Add a new scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "add-at" -d 'Add a one-shot scheduled task at an RFC3339 timestamp'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "add-every" -d 'Add a fixed-interval scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "once" -d 'Add a one-shot delayed task (e.g. "30m", "2h", "1d")'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "remove" -d 'Remove a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "update" -d 'Update a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "pause" -d 'Pause a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "resume" -d 'Resume a paused task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand cron; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and not __fish_seen_subcommand_from refresh list set status help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and not __fish_seen_subcommand_from refresh list set status help" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and not __fish_seen_subcommand_from refresh list set status help" -f -a "refresh" -d 'Refresh and cache provider models'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and not __fish_seen_subcommand_from refresh list set status help" -f -a "list" -d 'List cached models for a provider'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and not __fish_seen_subcommand_from refresh list set status help" -f -a "set" -d 'Set the default model in config'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and not __fish_seen_subcommand_from refresh list set status help" -f -a "status" -d 'Show current model configuration and cache status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and not __fish_seen_subcommand_from refresh list set status help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from refresh" -l provider -d 'Provider name (defaults to configured default provider)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from refresh" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from refresh" -l all -d 'Refresh all providers that support live model discovery'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from refresh" -l force -d 'Force live refresh and ignore fresh cache'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from refresh" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from list" -l provider -d 'Provider name (defaults to configured default provider)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from list" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from list" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from set" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from set" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from status" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from status" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from help" -f -a "refresh" -d 'Refresh and cache provider models'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from help" -f -a "list" -d 'List cached models for a provider'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from help" -f -a "set" -d 'Set the default model in config'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from help" -f -a "status" -d 'Show current model configuration and cache status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand models; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand providers" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand providers" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "list" -d 'List all configured channels'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "start" -d 'Start all configured channels (handled in main.rs for async)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "doctor" -d 'Run health checks for configured channels (handled in main.rs for async)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "add" -d 'Add a new channel configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "remove" -d 'Remove a channel configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "bind-telegram" -d 'Bind a Telegram identity (username or numeric user ID) into allowlist'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "send" -d 'Send a message to a configured channel'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and not __fish_seen_subcommand_from list start doctor add remove bind-telegram send help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from list" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from list" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from start" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from start" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from doctor" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from doctor" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from add" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from add" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from remove" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from remove" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from bind-telegram" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from bind-telegram" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from send" -l channel-id -d 'Channel config name (e.g. telegram, discord, slack)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from send" -l recipient -d 'Recipient identifier (platform-specific, e.g. Telegram chat ID)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from send" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from send" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "list" -d 'List all configured channels'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "start" -d 'Start all configured channels (handled in main.rs for async)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "doctor" -d 'Run health checks for configured channels (handled in main.rs for async)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "add" -d 'Add a new channel configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "remove" -d 'Remove a channel configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "bind-telegram" -d 'Bind a Telegram identity (username or numeric user ID) into allowlist'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "send" -d 'Send a message to a configured channel'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand channel; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and not __fish_seen_subcommand_from info help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and not __fish_seen_subcommand_from info help" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and not __fish_seen_subcommand_from info help" -f -a "info" -d 'Show details about a specific integration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and not __fish_seen_subcommand_from info help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and __fish_seen_subcommand_from info" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and __fish_seen_subcommand_from info" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and __fish_seen_subcommand_from help" -f -a "info" -d 'Show details about a specific integration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand integrations; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -f -a "list" -d 'List all installed skills'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -f -a "audit" -d 'Audit a skill source directory or installed skill name'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -f -a "install" -d 'Install a new skill from a URL or local path'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -f -a "remove" -d 'Remove an installed skill'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -f -a "test" -d 'Run TEST.sh validation for a skill (or all skills)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and not __fish_seen_subcommand_from list audit install remove test help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from list" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from list" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from audit" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from audit" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from install" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from install" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from remove" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from remove" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from test" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from test" -l verbose -d 'Show verbose output'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from test" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from help" -f -a "list" -d 'List all installed skills'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from help" -f -a "audit" -d 'Audit a skill source directory or installed skill name'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from help" -f -a "install" -d 'Install a new skill from a URL or local path'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from help" -f -a "remove" -d 'Remove an installed skill'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from help" -f -a "test" -d 'Run TEST.sh validation for a skill (or all skills)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand skills; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and not __fish_seen_subcommand_from openclaw help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and not __fish_seen_subcommand_from openclaw help" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and not __fish_seen_subcommand_from openclaw help" -f -a "openclaw" -d 'Import memory from an `OpenClaw` workspace into this `ZeroClaw` workspace'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and not __fish_seen_subcommand_from openclaw help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and __fish_seen_subcommand_from openclaw" -l source -d 'Optional path to `OpenClaw` workspace (defaults to ~/.openclaw/workspace)' -r -F
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and __fish_seen_subcommand_from openclaw" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and __fish_seen_subcommand_from openclaw" -l dry-run -d 'Validate and preview migration without writing any data'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and __fish_seen_subcommand_from openclaw" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and __fish_seen_subcommand_from help" -f -a "openclaw" -d 'Import memory from an `OpenClaw` workspace into this `ZeroClaw` workspace'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand migrate; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "login" -d 'Login with OAuth (OpenAI Codex or Gemini)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "paste-redirect" -d 'Complete OAuth by pasting redirect URL or auth code'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "paste-token" -d 'Paste setup token / auth token (for Anthropic subscription auth)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "setup-token" -d 'Alias for `paste-token` (interactive by default)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "refresh" -d 'Refresh OpenAI Codex access token using refresh token'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "logout" -d 'Remove auth profile'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "use" -d 'Set active profile for a provider'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "list" -d 'List auth profiles'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "status" -d 'Show auth status with active profile and token expiry info'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and not __fish_seen_subcommand_from login paste-redirect paste-token setup-token refresh logout use list status help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from login" -l provider -d 'Provider (`openai-codex` or `gemini`)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from login" -l profile -d 'Profile name (default: default)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from login" -l import -d 'Import an existing auth.json file instead of starting a new login flow. Currently supports only `openai-codex`; Codex defaults to `~/.codex/auth.json`' -r -F
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from login" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from login" -l device-code -d 'Use OAuth device-code flow'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from login" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-redirect" -l provider -d 'Provider (`openai-codex`)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-redirect" -l profile -d 'Profile name (default: default)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-redirect" -l input -d 'Full redirect URL or raw OAuth code' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-redirect" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-redirect" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-token" -l provider -d 'Provider (`anthropic`)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-token" -l profile -d 'Profile name (default: default)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-token" -l token -d 'Token value (if omitted, read interactively)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-token" -l auth-kind -d 'Auth kind override (`authorization` or `api-key`)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-token" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from paste-token" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from setup-token" -l provider -d 'Provider (`anthropic`)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from setup-token" -l profile -d 'Profile name (default: default)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from setup-token" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from setup-token" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from refresh" -l provider -d 'Provider (`openai-codex`)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from refresh" -l profile -d 'Profile name or profile id' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from refresh" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from refresh" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from logout" -l provider -d 'Provider' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from logout" -l profile -d 'Profile name (default: default)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from logout" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from logout" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from use" -l provider -d 'Provider' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from use" -l profile -d 'Profile name or full profile id' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from use" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from use" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from list" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from list" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from status" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from status" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "login" -d 'Login with OAuth (OpenAI Codex or Gemini)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "paste-redirect" -d 'Complete OAuth by pasting redirect URL or auth code'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "paste-token" -d 'Paste setup token / auth token (for Anthropic subscription auth)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "setup-token" -d 'Alias for `paste-token` (interactive by default)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "refresh" -d 'Refresh OpenAI Codex access token using refresh token'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "logout" -d 'Remove auth profile'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "use" -d 'Set active profile for a provider'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "list" -d 'List auth profiles'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "status" -d 'Show auth status with active profile and token expiry info'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand auth; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and not __fish_seen_subcommand_from discover introspect info help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and not __fish_seen_subcommand_from discover introspect info help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and not __fish_seen_subcommand_from discover introspect info help" -f -a "discover" -d 'Enumerate USB devices (VID/PID) and show known boards'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and not __fish_seen_subcommand_from discover introspect info help" -f -a "introspect" -d 'Introspect a device by path (e.g. /dev/ttyACM0)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and not __fish_seen_subcommand_from discover introspect info help" -f -a "info" -d 'Get chip info via USB (probe-rs over ST-Link). No firmware needed on target'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and not __fish_seen_subcommand_from discover introspect info help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from discover" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from discover" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from introspect" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from introspect" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from info" -l chip -d 'Chip name (e.g. STM32F401RETx). Default: STM32F401RETx for Nucleo-F401RE' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from info" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from info" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from help" -f -a "discover" -d 'Enumerate USB devices (VID/PID) and show known boards'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from help" -f -a "introspect" -d 'Introspect a device by path (e.g. /dev/ttyACM0)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from help" -f -a "info" -d 'Get chip info via USB (probe-rs over ST-Link). No firmware needed on target'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand hardware; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -f -a "list" -d 'List configured peripherals'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -f -a "add" -d 'Add a peripheral (board path, e.g. nucleo-f401re /dev/ttyACM0)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -f -a "flash" -d 'Flash ZeroClaw firmware to Arduino (creates .ino, installs arduino-cli if needed, uploads)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -f -a "setup-uno-q" -d 'Setup Arduino Uno Q Bridge app (deploy GPIO bridge for agent control)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -f -a "flash-nucleo" -d 'Flash ZeroClaw firmware to Nucleo-F401RE (builds + probe-rs run)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and not __fish_seen_subcommand_from list add flash setup-uno-q flash-nucleo help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from list" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from list" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from add" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from add" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from flash" -s p -l port -d 'Serial port (e.g. /dev/cu.usbmodem12345). If omitted, uses first arduino-uno from config' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from flash" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from flash" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from setup-uno-q" -l host -d 'Uno Q IP (e.g. 192.168.0.48). If omitted, assumes running ON the Uno Q' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from setup-uno-q" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from setup-uno-q" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from flash-nucleo" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from flash-nucleo" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from help" -f -a "list" -d 'List configured peripherals'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from help" -f -a "add" -d 'Add a peripheral (board path, e.g. nucleo-f401re /dev/ttyACM0)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from help" -f -a "flash" -d 'Flash ZeroClaw firmware to Arduino (creates .ino, installs arduino-cli if needed, uploads)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from help" -f -a "setup-uno-q" -d 'Setup Arduino Uno Q Bridge app (deploy GPIO bridge for agent control)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from help" -f -a "flash-nucleo" -d 'Flash ZeroClaw firmware to Nucleo-F401RE (builds + probe-rs run)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand peripheral; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and not __fish_seen_subcommand_from list get stats clear help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and not __fish_seen_subcommand_from list get stats clear help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and not __fish_seen_subcommand_from list get stats clear help" -f -a "list" -d 'List memory entries with optional filters'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and not __fish_seen_subcommand_from list get stats clear help" -f -a "get" -d 'Get a specific memory entry by key'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and not __fish_seen_subcommand_from list get stats clear help" -f -a "stats" -d 'Show memory backend statistics and health'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and not __fish_seen_subcommand_from list get stats clear help" -f -a "clear" -d 'Clear memories by category, by key, or clear all'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and not __fish_seen_subcommand_from list get stats clear help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from list" -l category -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from list" -l session -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from list" -l limit -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from list" -l offset -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from list" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from list" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from get" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from get" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from stats" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from stats" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from clear" -l key -d 'Delete a single entry by key (supports prefix match)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from clear" -l category -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from clear" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from clear" -l yes -d 'Skip confirmation prompt'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from clear" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from help" -f -a "list" -d 'List memory entries with optional filters'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from help" -f -a "get" -d 'Get a specific memory entry by key'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from help" -f -a "stats" -d 'Show memory backend statistics and health'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from help" -f -a "clear" -d 'Clear memories by category, by key, or clear all'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand memory; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and not __fish_seen_subcommand_from schema help" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and not __fish_seen_subcommand_from schema help" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and not __fish_seen_subcommand_from schema help" -f -a "schema" -d 'Dump the full configuration JSON Schema to stdout'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and not __fish_seen_subcommand_from schema help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and __fish_seen_subcommand_from schema" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and __fish_seen_subcommand_from schema" -s h -l help -d 'Print help'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and __fish_seen_subcommand_from help" -f -a "schema" -d 'Dump the full configuration JSON Schema to stdout'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand config; and __fish_seen_subcommand_from help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand update" -l version -d 'Target version (default: latest)' -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand update" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand update" -l check -d 'Only check for updates, don\'t install'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand update" -l force -d 'Skip confirmation prompt'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand update" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand self-test" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand self-test" -l quick -d 'Run quick checks only (no network)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand self-test" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand completions" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand completions" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand desktop" -l config-dir -r
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand desktop" -l install -d 'Download and install the companion app'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand desktop" -s h -l help -d 'Print help (see more with \'--help\')'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "onboard" -d 'Initialize your workspace and configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "agent" -d 'Start the AI agent loop'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "gateway" -d 'Start/manage the gateway server (webhooks, websockets)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "acp" -d 'Start ACP (Agent Control Protocol) server over stdio'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "daemon" -d 'Start long-running autonomous runtime (gateway + channels + heartbeat + scheduler)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "service" -d 'Manage OS service lifecycle (launchd/systemd user service)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "doctor" -d 'Run diagnostics for daemon/scheduler/channel freshness'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "status" -d 'Show system status (full details)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "estop" -d 'Engage, inspect, and resume emergency-stop states'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "cron" -d 'Configure and manage scheduled tasks'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "models" -d 'Manage provider model catalogs'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "providers" -d 'List supported AI providers'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "channel" -d 'Manage channels (telegram, discord, slack)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "integrations" -d 'Browse 50+ integrations'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "skills" -d 'Manage skills (user-defined capabilities)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "migrate" -d 'Migrate data from other agent runtimes'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "auth" -d 'Manage provider subscription authentication profiles'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "hardware" -d 'Discover and introspect USB hardware'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "peripheral" -d 'Manage hardware peripherals (STM32, RPi GPIO, etc.)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "memory" -d 'Manage agent memory (list, get, stats, clear)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "config" -d 'Manage configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "update" -d 'Check for and apply updates'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "self-test" -d 'Run diagnostic self-tests'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "completions" -d 'Generate shell completion script to stdout'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "desktop" -d 'Launch or install the companion desktop app'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and not __fish_seen_subcommand_from onboard agent gateway acp daemon service doctor status estop cron models providers channel integrations skills migrate auth hardware peripheral memory config update self-test completions desktop help" -f -a "help" -d 'Print this message or the help of the given subcommand(s)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from gateway" -f -a "start" -d 'Start the gateway server (default if no subcommand specified)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from gateway" -f -a "restart" -d 'Restart the gateway server'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from gateway" -f -a "get-paircode" -d 'Show or generate the pairing code without restarting'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from service" -f -a "install" -d 'Install daemon service unit for auto-start and restart'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from service" -f -a "start" -d 'Start daemon service'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from service" -f -a "stop" -d 'Stop daemon service'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from service" -f -a "restart" -d 'Restart daemon service to apply latest config'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from service" -f -a "status" -d 'Check daemon service status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from service" -f -a "uninstall" -d 'Uninstall daemon service unit'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from service" -f -a "logs" -d 'Tail daemon service logs'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from doctor" -f -a "models" -d 'Probe model catalogs across providers and report availability'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from doctor" -f -a "traces" -d 'Query runtime trace events (tool diagnostics and model replies)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from estop" -f -a "status" -d 'Print current estop status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from estop" -f -a "resume" -d 'Resume from an engaged estop level'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "list" -d 'List all scheduled tasks'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "add" -d 'Add a new scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "add-at" -d 'Add a one-shot scheduled task at an RFC3339 timestamp'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "add-every" -d 'Add a fixed-interval scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "once" -d 'Add a one-shot delayed task (e.g. "30m", "2h", "1d")'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "remove" -d 'Remove a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "update" -d 'Update a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "pause" -d 'Pause a scheduled task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from cron" -f -a "resume" -d 'Resume a paused task'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from models" -f -a "refresh" -d 'Refresh and cache provider models'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from models" -f -a "list" -d 'List cached models for a provider'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from models" -f -a "set" -d 'Set the default model in config'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from models" -f -a "status" -d 'Show current model configuration and cache status'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from channel" -f -a "list" -d 'List all configured channels'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from channel" -f -a "start" -d 'Start all configured channels (handled in main.rs for async)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from channel" -f -a "doctor" -d 'Run health checks for configured channels (handled in main.rs for async)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from channel" -f -a "add" -d 'Add a new channel configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from channel" -f -a "remove" -d 'Remove a channel configuration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from channel" -f -a "bind-telegram" -d 'Bind a Telegram identity (username or numeric user ID) into allowlist'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from channel" -f -a "send" -d 'Send a message to a configured channel'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from integrations" -f -a "info" -d 'Show details about a specific integration'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from skills" -f -a "list" -d 'List all installed skills'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from skills" -f -a "audit" -d 'Audit a skill source directory or installed skill name'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from skills" -f -a "install" -d 'Install a new skill from a URL or local path'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from skills" -f -a "remove" -d 'Remove an installed skill'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from skills" -f -a "test" -d 'Run TEST.sh validation for a skill (or all skills)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from migrate" -f -a "openclaw" -d 'Import memory from an `OpenClaw` workspace into this `ZeroClaw` workspace'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "login" -d 'Login with OAuth (OpenAI Codex or Gemini)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "paste-redirect" -d 'Complete OAuth by pasting redirect URL or auth code'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "paste-token" -d 'Paste setup token / auth token (for Anthropic subscription auth)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "setup-token" -d 'Alias for `paste-token` (interactive by default)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "refresh" -d 'Refresh OpenAI Codex access token using refresh token'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "logout" -d 'Remove auth profile'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "use" -d 'Set active profile for a provider'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "list" -d 'List auth profiles'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from auth" -f -a "status" -d 'Show auth status with active profile and token expiry info'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from hardware" -f -a "discover" -d 'Enumerate USB devices (VID/PID) and show known boards'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from hardware" -f -a "introspect" -d 'Introspect a device by path (e.g. /dev/ttyACM0)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from hardware" -f -a "info" -d 'Get chip info via USB (probe-rs over ST-Link). No firmware needed on target'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from peripheral" -f -a "list" -d 'List configured peripherals'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from peripheral" -f -a "add" -d 'Add a peripheral (board path, e.g. nucleo-f401re /dev/ttyACM0)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from peripheral" -f -a "flash" -d 'Flash ZeroClaw firmware to Arduino (creates .ino, installs arduino-cli if needed, uploads)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from peripheral" -f -a "setup-uno-q" -d 'Setup Arduino Uno Q Bridge app (deploy GPIO bridge for agent control)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from peripheral" -f -a "flash-nucleo" -d 'Flash ZeroClaw firmware to Nucleo-F401RE (builds + probe-rs run)'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from memory" -f -a "list" -d 'List memory entries with optional filters'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from memory" -f -a "get" -d 'Get a specific memory entry by key'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from memory" -f -a "stats" -d 'Show memory backend statistics and health'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from memory" -f -a "clear" -d 'Clear memories by category, by key, or clear all'
complete -c zeroclaw -n "__fish_zeroclaw_using_subcommand help; and __fish_seen_subcommand_from config" -f -a "schema" -d 'Dump the full configuration JSON Schema to stdout'
