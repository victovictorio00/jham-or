#!/usr/bin/env bash
set -euo pipefail
cd /home/sistemas/Jham-or
backup_dir="${JHAMOR_BACKUP_DIR:-/home/sistemas/deployments/jhamor-backups}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
backup_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_tmp="$backup_dir/.database-$backup_stamp.tmp"
trap 'rm -f "$backup_tmp"' EXIT
docker compose -p jhamor exec -T postgres pg_dump -U jhamor -d jhamor -Fc > "$backup_tmp"
chmod 600 "$backup_tmp"
mv "$backup_tmp" "$backup_dir/database-$backup_stamp.dump"
docker run --rm --user "$(id -u):$(id -g)" -v jhamor_uploads:/source:ro -v "$backup_dir":/backup postgres:17-bookworm tar czf "/backup/images-$backup_stamp.tar.gz" -C /source .
chmod 600 "$backup_dir/images-$backup_stamp.tar.gz"
echo "Jham-or backup completed: $backup_stamp"
