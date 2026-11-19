#!/bin/bash
# Scheduled Hesabu scrape (run by launchd: ~/Library/LaunchAgents/com.hesabu.scraper.plist)
# Usage: scripts/hesabu/cron.sh [npm-script]   default: hesabu:scrape (priority counties)
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
NODE_BIN="/Users/ken/.nvm/versions/node/v20.19.6/bin"   # launchd doesn't load nvm
export PATH="$NODE_BIN:/usr/local/bin:/usr/bin:/bin"

SCRIPT="${1:-hesabu:scrape}"
LOG_DIR="$PROJECT_DIR/scripts/hesabu/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/scrape-$(date +%Y-%m-%d_%H%M).log"

cd "$PROJECT_DIR"
echo "=== $(date) — npm run $SCRIPT ===" >> "$LOG"
npm run "$SCRIPT" >> "$LOG" 2>&1
echo "=== finished $(date) ===" >> "$LOG"

# keep the last 24 logs
ls -1t "$LOG_DIR"/scrape-*.log | tail -n +25 | xargs -r rm -f
