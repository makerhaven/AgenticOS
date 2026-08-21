# Deployment — CyberPanel VPS (OpenLiteSpeed)

Target box: 4-core, 16 GB DDR5, 240 GB NVMe. The app is a Node server on `127.0.0.1:3737`, proxied at `/control` under your existing domain. Only 80/443 are public.

Two runtime paths — pick one:

- **Docker (recommended)** — `docker compose up -d --build` runs `agentic-os` + the `graphify` memory sidecar sharing the host vault. See **docs/MEMORY.md** for the two-container topology and contract.
- **PM2 / bare metal** — `scripts/setup.sh` (below). The app falls back to its built-in local indexer; no sidecar.

## 0. Docker path (recommended)

```bash
mkdir -p /srv/agentic-os/vault
cd /srv/agentic-os && git clone https://github.com/<you>/agentic-os.git app
cd app
cp .env.example .env      # fill in keys / passcode
docker compose up -d --build
```

- `agentic-os` → `127.0.0.1:3737` (proxy `/control` here — step 3 below is unchanged)
- `graphify` → internal only on the `agentic-net` bridge; the app reaches it at `http://graphify:4747` (set automatically by compose)
- Host vault at `/srv/agentic-os/vault` is mounted **rw into the app** and **ro into Graphify**
- If your real Obsidian vault already exists, symlink it: `ln -s /path/to/real/vault /srv/agentic-os/vault`

Then continue at step 3 (CyberPanel proxy context).

## 1. Get the code on the box

```bash
cd /home/<your-user>
git clone https://github.com/<you>/agentic-os.git
cd agentic-os
```

## 2. One-shot setup

```bash
bash scripts/setup.sh
```

This installs Node 20 (via nvm), `npm ci`, copies `.env.example` → `.env`, creates the vault skeleton (`vault/Goals`, `Journal`, `Business Context`, `Decisions`, `Memory`, `inbox`), builds, and starts under PM2 with boot persistence.

## 3. CyberPanel: SSL + proxy context

1. **CyberPanel → Websites → List → Manage → SSL** → issue Let's Encrypt for your domain.
2. **vHost** (CyberPanel → site → vHost, or LiteSpeed WebAdmin → Virtual Hosts → your vHost → **Context**):
   - Type: `Proxy`
   - URI: `/control`
   - Address: `http://127.0.0.1:3737`
   - Save → `systemctl restart lsws`
3. Open `https://your-domain/control` — Mission Control loads.

> Alternative (cleaner cookies/websockets): create a subdomain site `control.your-domain` in CyberPanel and proxy URI `/` → `http://127.0.0.1:3737`. If you do this, remove `basePath` from `next.config.ts` and rebuild.

## 4. Lock it

```bash
# .env
CONTROL_PASSCODE=pick-something-long
VAULT_PATH=/home/<your-user>/agentic-os/vault   # PM2 path; Docker uses /vault via the mount
```

PM2 path: `pm2 restart agentic-os` · Docker path: `docker compose up -d --force-recreate`

`/control` now requires the passcode (cookie, 30 days).

## 5. Wire real models (optional)

```bash
# .env
OPENROUTER_API_KEY=sk-or-...   # lights up free/budget tiers
ANTHROPIC_API_KEY=sk-ant-...   # tier 2
```

`pm2 restart agentic-os`. Everything still works with zero keys via the mock adapter.

## Resource guardrails (already in code)

- `MAX_CONCURRENT_RUNS=3` — caps parallel agent runs on 4 cores
- PM2 `max_memory_restart: 1G`, daily 04:00 bounce
- Memory Galaxy renders client-side; the server only ships nodes/edges JSON
- Graph index cached 15s, rebuilt incrementally
- Token ledger logs every model call; watch Mission Control's daily readout

## Updating

PM2 path:
```bash
git pull && npm ci && npm run build && pm2 restart agentic-os
```

Docker path:
```bash
git pull && docker compose up -d --build
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| 404 at /control | proxy context URI must be exactly `/control`; restart lsws |
| 502 | `pm2 status` — app down; `pm2 logs agentic-os` |
| Blank page on phone | hard-refresh; the PWA caches aggressively |
| Vault empty | check `VAULT_PATH` in `.env`, then `pm2 restart` |
