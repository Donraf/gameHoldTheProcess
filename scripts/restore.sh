#!/usr/bin/env bash
#
# Восстановление базы HoldTheProcess из бэкапа (запускать от root).
# ВНИМАНИЕ: текущее содержимое базы будет ПОЛНОСТЬЮ заменено бэкапом.
#
# Использование:
#   chmod +x scripts/restore.sh
#   ./scripts/restore.sh /root/backups/ghtp_YYYYMMDD_HHMMSS.dump
#
set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/root/go/.env}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-gameuser}"
DB_NAME="${DB_NAME:-game_hold_the_process_db}"
BACKEND_SERVICE="${BACKEND_SERVICE:-gameholdtheprocesssite}"

BACKUP_FILE="${1:-}"
if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
    echo "ОШИБКА: укажите существующий файл бэкапа" >&2
    echo "Использование: $0 /root/backups/ghtp_YYYYMMDD_HHMMSS.dump" >&2
    exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
fi
: "${DB_PASSWORD:?не задан DB_PASSWORD (ожидался в $ENV_FILE)}"
export PGPASSWORD="$DB_PASSWORD"

echo "База $DB_NAME будет ПОЛНОСТЬЮ заменена содержимым $BACKUP_FILE"
read -r -p "Продолжить? [y/N] " answer
if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    echo "Отменено."
    exit 0
fi

echo "1. Останавливаю бэкенд ($BACKEND_SERVICE)"
systemctl stop "$BACKEND_SERVICE" || true

echo "2. Пересоздаю базу"
# Бэкенд остановлен, но на всякий случай разрываем оставшиеся подключения.
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" --if-exists "$DB_NAME"
createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"

echo "3. Восстанавливаю данные из бэкапа"
pg_restore -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" --no-owner "$BACKUP_FILE"

echo "4. Запускаю бэкенд"
systemctl start "$BACKEND_SERVICE"

echo "Восстановление завершено."
echo "ВАЖНО: если бэкап сделан до миграции 000020 (user_parameter_sets.id),"
echo "верните код на коммит до c42ee05 либо прогоните миграцию заново."
