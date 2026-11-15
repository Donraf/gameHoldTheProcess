#!/usr/bin/env bash
#
# Бэкап базы HoldTheProcess на сервере (запускать от root).
# Пароль БД берётся из /root/go/.env (DB_PASSWORD), его пишет деплой-скрипт.
#
# Использование:
#   chmod +x scripts/backup.sh
#   ./scripts/backup.sh            # файл /root/backups/ghtp_YYYYMMDD_HHMMSS.dump
#
set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/root/go/.env}"
BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-gameuser}"
DB_NAME="${DB_NAME:-game_hold_the_process_db}"

if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
fi
: "${DB_PASSWORD:?не задан DB_PASSWORD (ожидался в $ENV_FILE)}"
export PGPASSWORD="$DB_PASSWORD"

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/ghtp_$(date +%Y%m%d_%H%M%S).dump"

pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -Fc -f "$BACKUP_FILE" "$DB_NAME"

echo "Бэкап создан: $BACKUP_FILE"
echo "Восстановление: ./scripts/restore.sh $BACKUP_FILE"
