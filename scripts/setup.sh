#!/usr/bin/env bash
# Agentic OS — one-shot setup for a CyberPanel VPS (Ubuntu/AlmaLinux).
# Installs Node 20, builds the app, starts it under PM2, seeds the vault.
set -euo pipefail

echo "▸ Node 20"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
fi

echo "▸ Dependencies"
npm ci

echo "▸ Env"
[ -f .env ] || cp .env.example .env

echo "▸ Vault skeleton"
mkdir -p vault/{Goals,Journal,"Business Context",Decisions,Memory,inbox} data/logs workspaces

echo "▸ Build"
npm run build

echo "▸ PM2"
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup || true

echo ""
echo "✓ Agentic OS running at http://127.0.0.1:3737/control"
echo "  Next: CyberPanel → your site → vHost → Context → proxy /control → http://127.0.0.1:3737"
