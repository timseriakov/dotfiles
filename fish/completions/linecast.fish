# fish completion for linecast
complete -c linecast -f -n '__fish_use_subcommand' -a 'weather sunshine moon tides radar maps location completion'
complete -c linecast -f -n '__fish_use_subcommand' -l help -s h
complete -c linecast -f -n '__fish_use_subcommand' -l version -s v
complete -c linecast -f -n '__fish_seen_subcommand_from completion' -a 'bash zsh fish'
complete -c linecast -f -n '__fish_seen_subcommand_from completion' -l help -s h
complete -c linecast -f -n '__fish_seen_subcommand_from location' -a 'show set auto search'
complete -c linecast -f -n '__fish_seen_subcommand_from location' -l help -s h
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l help
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -s h
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l version
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l print
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l live
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l oneline
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l json
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l location -r
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l search -r
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l emoji
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l metric
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l celsius
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l fahrenheit
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l no-shading
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l classic-colors
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l legacy-colors
complete -c linecast -f -n '__fish_seen_subcommand_from weather' -l debug
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l help
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -s h
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l version
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l print
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l live
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l oneline
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l json
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l station -r
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l search -r
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l nearby
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l metric
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l classic-colors
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l legacy-colors
complete -c linecast -f -n '__fish_seen_subcommand_from tides' -l debug
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l help
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -s h
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l version
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l print
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l live
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l oneline
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l json
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l emoji
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l classic-colors
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l legacy-colors
complete -c linecast -f -n '__fish_seen_subcommand_from sunshine' -l debug
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l help
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -s h
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l version
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l print
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l live
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l oneline
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l json
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l emoji
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l classic-colors
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l legacy-colors
complete -c linecast -f -n '__fish_seen_subcommand_from moon' -l debug
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l help
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -s h
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l version
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l print
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l live
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l oneline
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l location -r
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l search -r
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l zoom -r
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l theme -r -a 'dark-sky universal-blue rainbow nexrad original titan twc meteored datameteo viper mrms max-storm black-white'
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l layer -r -a 'radar satellite'
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l layers -r -a 'temp wind temp,wind'
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l emoji
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l classic-colors
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l legacy-colors
complete -c linecast -f -n '__fish_seen_subcommand_from radar' -l debug
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l help
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -s h
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l version
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l print
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l live
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l oneline
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l location -r
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l search -r
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l zoom -r
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l view -r -a 'street terrain'
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l to -r
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l from -r
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l profile -r -a 'car bike foot'
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l emoji
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l classic-colors
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l legacy-colors
complete -c linecast -f -n '__fish_seen_subcommand_from maps' -l debug
complete -c weather -f -l help
complete -c weather -f -s h
complete -c weather -f -l version
complete -c weather -f -l print
complete -c weather -f -l live
complete -c weather -f -l oneline
complete -c weather -f -l json
complete -c weather -f -l location -r
complete -c weather -f -l search -r
complete -c weather -f -l emoji
complete -c weather -f -l metric
complete -c weather -f -l celsius
complete -c weather -f -l fahrenheit
complete -c weather -f -l no-shading
complete -c weather -f -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c weather -f -l classic-colors
complete -c weather -f -l legacy-colors
complete -c weather -f -l debug
complete -c tides -f -l help
complete -c tides -f -s h
complete -c tides -f -l version
complete -c tides -f -l print
complete -c tides -f -l live
complete -c tides -f -l oneline
complete -c tides -f -l json
complete -c tides -f -l station -r
complete -c tides -f -l search -r
complete -c tides -f -l nearby
complete -c tides -f -l metric
complete -c tides -f -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c tides -f -l classic-colors
complete -c tides -f -l legacy-colors
complete -c tides -f -l debug
complete -c sunshine -f -l help
complete -c sunshine -f -s h
complete -c sunshine -f -l version
complete -c sunshine -f -l print
complete -c sunshine -f -l live
complete -c sunshine -f -l oneline
complete -c sunshine -f -l json
complete -c sunshine -f -l emoji
complete -c sunshine -f -l classic-colors
complete -c sunshine -f -l legacy-colors
complete -c sunshine -f -l debug
complete -c moon -f -l help
complete -c moon -f -s h
complete -c moon -f -l version
complete -c moon -f -l print
complete -c moon -f -l live
complete -c moon -f -l oneline
complete -c moon -f -l json
complete -c moon -f -l emoji
complete -c moon -f -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c moon -f -l classic-colors
complete -c moon -f -l legacy-colors
complete -c moon -f -l debug
complete -c radar -f -l help
complete -c radar -f -s h
complete -c radar -f -l version
complete -c radar -f -l print
complete -c radar -f -l live
complete -c radar -f -l oneline
complete -c radar -f -l location -r
complete -c radar -f -l search -r
complete -c radar -f -l zoom -r
complete -c radar -f -l theme -r -a 'dark-sky universal-blue rainbow nexrad original titan twc meteored datameteo viper mrms max-storm black-white'
complete -c radar -f -l layer -r -a 'radar satellite'
complete -c radar -f -l layers -r -a 'temp wind temp,wind'
complete -c radar -f -l emoji
complete -c radar -f -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c radar -f -l classic-colors
complete -c radar -f -l legacy-colors
complete -c radar -f -l debug
complete -c maps -f -l help
complete -c maps -f -s h
complete -c maps -f -l version
complete -c maps -f -l print
complete -c maps -f -l live
complete -c maps -f -l oneline
complete -c maps -f -l location -r
complete -c maps -f -l search -r
complete -c maps -f -l zoom -r
complete -c maps -f -l view -r -a 'street terrain'
complete -c maps -f -l to -r
complete -c maps -f -l from -r
complete -c maps -f -l profile -r -a 'car bike foot'
complete -c maps -f -l emoji
complete -c maps -f -l lang -r -a 'en fr es de it pt nl pl no sv is da fi ja ko zh id'
complete -c maps -f -l classic-colors
complete -c maps -f -l legacy-colors
complete -c maps -f -l debug
