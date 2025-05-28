#!/usr/bin/env fish

set -l gateway 192.168.1.1
set -l domain backend.raycast.com
set -l anchor_path /tmp/raycast-anchor.conf
set -l pf_conf /tmp/raycast-pf.conf
set -l log_path /tmp/mitmproxy.log
set -l mitm_port 9090

echo "🌐 Резолвим IP для $domain..."
set -l ips (dig +short $domain | grep -E '^[0-9.]+$')

if test (count $ips) -eq 0
    echo "❌ Не удалось получить IP. Проверь DNS или сеть."
    exit 1
end

echo "📡 Добавляем маршруты в обход VPN..."
for ip in $ips
    echo "⤴ $ip → $gateway"
    sudo route -n add -host $ip $gateway ^/dev/null
end

echo "🔁 Генерируем pf anchor и правила..."
echo "" >$anchor_path
for ip in $ips
    echo "rdr pass on en0 inet proto tcp from any to $ip port 443 -> 127.0.0.1 port $mitm_port" >>$anchor_path
end

printf '%s\n' \
    'nat-anchor "raycast"' \
    'rdr-anchor "raycast"' \
    'load anchor "raycast" from "/tmp/raycast-anchor.conf"' >/tmp/raycast-pf.conf

echo "🧱 Применяем pf anchor правила..."
sudo pfctl -F nat
sudo pfctl -f $pf_conf
sudo pfctl -e

echo "🧪 Запускаем mitmdump в transparent-режиме..."
echo "  (лог: $log_path)"

# Убиваем старый процесс, если есть
set -l pid (pgrep -f "mitmdump.*--mode transparent")
if test -n "$pid"
    echo "🔪 Убиваем старый mitmdump (PID $pid)"
    kill -9 $pid
end

mitmdump --mode transparent --showhost --listen-port $mitm_port --set block_global=false -w $log_path &

echo "✅ Всё запущено. Проверь /tmp/mitmproxy.log или открой tail -f $log_path"
