#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/srv/atelier"
DATABASE="$APP_DIR/data/atelier.db"
BACKUP_DIR="$APP_DIR/backups"

if [ ! -f "$DATABASE" ]; then
  echo "No database yet; nothing to back up."
  exit 0
fi

command -v sqlite3 >/dev/null || {
  echo "sqlite3 is not installed" >&2
  exit 1
}

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

timestamp=$(date +%Y%m%d-%H%M%S)
destination="$BACKUP_DIR/atelier-$timestamp.db"

sqlite3 "$DATABASE" ".backup '$destination'"
chmod 600 "$destination"

integrity=$(sqlite3 "$destination" "PRAGMA integrity_check;")
if [ "$integrity" != "ok" ]; then
  echo "Backup integrity check failed: $integrity" >&2
  exit 1
fi

# Daily backups are retained for 14 days. Pre-deploy backups follow the same rule.
find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.db' -mtime +14 -delete
echo "Backup written: $destination"
