#!/bin/bash
# Автозапуск локального сервера (npm run dev) на вашому Mac: стартує при вході в систему
# і сам піднімається, якщо впаде чи його зупинять. Працює, навіть коли Claude закритий.
#
#   Увімкнути:   bash scripts/dev-autostart.sh on
#   Вимкнути:    bash scripts/dev-autostart.sh off
#   Стан:        bash scripts/dev-autostart.sh status
#   Журнал:      ~/Library/Logs/ai-bouquet-dev.log
set -e

LABEL="com.meadowflowers.aibouquet.dev"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$HOME/Library/Logs/ai-bouquet-dev.log"
DOMAIN="gui/$(id -u)"

case "${1:-}" in
  on)
    mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "$PROJECT" &amp;&amp; exec npm run dev</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    # якщо порт 3000 уже зайнятий вручну запущеним сервером, звільняємо його
    lsof -ti tcp:3000 -sTCP:LISTEN | xargs kill 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    echo "Автозапуск увімкнено. Сервер: http://localhost:3000 (журнал: $LOG)"
    ;;
  off)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Автозапуск вимкнено."
    ;;
  status)
    launchctl print "$DOMAIN/$LABEL" 2>/dev/null | grep -E "state|pid" || echo "Автозапуск не увімкнено."
    curl -s -o /dev/null -w "http://localhost:3000 відповідає: %{http_code}\n" --max-time 5 http://localhost:3000 || true
    ;;
  *)
    echo "Використання: bash scripts/dev-autostart.sh on | off | status"
    ;;
esac
