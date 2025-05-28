#!/usr/bin/env fish

set gateway 192.168.1.1
set domain backend.raycast.com

echo "🌐 Resolving $domain ..."
set ips (dig +short $domain | grep -E '^[0-9.]+$')

if test (count $ips) -eq 0
    echo "❌ Не удалось получить IP. Проверь DNS или сеть."
    exit 1
end

for ip in $ips
    echo "📡 Добавляю маршрут для $ip → $gateway (в обход VPN)"
    sudo route -n add -host $ip $gateway 2>/dev/null
end

echo "✅ Готово! Raycast теперь будет идти мимо VPN на $domain"
