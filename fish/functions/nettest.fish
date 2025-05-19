function nettest
    # === No global sudo elevation ===

    # === Config ===
    set LOGDIR ~/dev/tmp/netlogs
    mkdir -p $LOGDIR

    # Log filename
    set TIMESTAMP (date "+%Y-%m-%d_%H-%M-%S")
    set RAND (math (random))
    set LOGFILE (string join "" $LOGDIR "/nettest_" $TIMESTAMP "_" $RAND ".log")

    # latest.log as symlink
    ln -sf $LOGFILE "$LOGDIR/latest.log"

    echo "Writing to log: $LOGFILE"

    # === VPS ===
    set VPS_IP "95.164.69.103"

    # === Header ===
    echo "📡 Net Diagnostic — $TIMESTAMP" >>$LOGFILE
    echo "VPS: $VPS_IP" >>$LOGFILE
    echo "" >>$LOGFILE

    # === SPEEDTEST ===
    echo "--- SPEEDTEST ---" >>$LOGFILE
    if type -q speedtest
        speedtest --simple >>$LOGFILE
    else
        echo "⚠️ speedtest is not installed." >>$LOGFILE
    end
    echo "" >>$LOGFILE

    # === MTR ===
    echo "--- MTR 8.8.8.8 ---" >>$LOGFILE
    set -x TERM dumb
    sudo /opt/homebrew/sbin/mtr --report-wide --report-cycles 100 8.8.8.8 >>$LOGFILE
    set -x TERM xterm-kitty
    echo "" >>$LOGFILE

    echo "--- MTR VPS ($VPS_IP) ---" >>$LOGFILE
    set -x TERM dumb
    sudo /opt/homebrew/sbin/mtr --report-wide --report-cycles 100 $VPS_IP >>$LOGFILE
    set -x TERM xterm-kitty

    echo "" >>$LOGFILE

    # === PING ===
    echo "--- PING 8.8.8.8 ---" >>$LOGFILE
    ping -c 100 8.8.8.8 >>$LOGFILE
    echo "" >>$LOGFILE

    echo "--- PING VPS ($VPS_IP) ---" >>$LOGFILE
    ping -c 100 $VPS_IP >>$LOGFILE
    echo "" >>$LOGFILE

    # === TRACEROUTE ===
    echo "--- TRACEROUTE 8.8.8.8 ---" >>$LOGFILE
    traceroute 8.8.8.8 >>$LOGFILE
    echo "" >>$LOGFILE

    echo "✅ Log saved to: $LOGFILE"
end
