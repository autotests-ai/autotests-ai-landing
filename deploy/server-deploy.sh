#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/autotests-ai-landing}"
REPO_URL="${REPO_URL:-https://github.com/autotests-ai/autotests-ai-landing.git}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$APP_DIR"
  sudo git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch --all
git reset --hard origin/main

docker compose build backend
docker compose up -d --remove-orphans

curl -fsS http://127.0.0.1:8081/api/terminal | grep -q postgresql

if [[ -f deploy/nginx/autotests.ai.conf ]]; then
  sudo cp deploy/nginx/autotests.ai.conf /etc/nginx/conf.d/autotests.ai.conf
  sudo nginx -t
  sudo systemctl reload nginx
fi

echo "Deploy OK: https://autotests.ai"
