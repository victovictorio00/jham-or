#!/usr/bin/env bash
set -euo pipefail
cd /home/sistemas/jham-or
export PATH="$PWD/node_modules/node/bin:$PATH"
npm run db:migrate
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/export-publication.ts
docker compose -p jhamor build app
docker compose -p jhamor up -d --wait --wait-timeout 180 app
cp infra/nginx.conf /home/sistemas/Auriel/infra/nginx/jhamor.conf
docker exec auriel-nginx-1 nginx -t
docker exec auriel-nginx-1 nginx -s reload
