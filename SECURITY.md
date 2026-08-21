# Security Policy

## Model

Agentic OS is **single-tenant, self-hosted** software. It is designed to run bound to `127.0.0.1` behind a reverse proxy (OpenLiteSpeed/CyberPanel) with TLS, optionally gated by the `CONTROL_PASSCODE` env var.

## Hard rules the codebase enforces

- API keys live in `.env` / environment variables only — **never** in the vault, never in client bundles, never rendered in the UI (Settings shows presence, not values).
- The Control Room export (`markdown` / `json`) runs every run through `lib/redact.ts` before writing.
- All vault file access is path-normalized and confined to `VAULT_PATH` (`lib/vault.ts`).
- Kanban workers must move a card to BLOCKED and ask before destructive or uncertain actions.

## Your responsibilities as an operator

- Keep the Node port bound to localhost; expose only 80/443 publicly.
- Set `CONTROL_PASSCODE` before sharing the URL beyond your own devices.
- Treat the vault as sensitive data — it holds your business context.

## Reporting

Open a private security advisory on GitHub (Security → Advisories) rather than a public issue. Include reproduction steps and the affected route/file. We aim to acknowledge within 72 hours.
