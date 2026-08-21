<div align="center">

# ◈ Agentic OS

**One screen. Every agent. One shared brain.**

A self-hosted command center for your AI agents — dark aubergine-and-gold cockpit at `/control`,
an Obsidian vault as shared memory rendered as a 3D **Memory Galaxy**, a six-lane **Agent Kanban**
with an orchestrating dispatcher, **Goal Mode** ("set the target, walk away"), a multi-model
**Mastermind** group chat, an **SEO pipeline**, a **Studio** for video/games/music/thumbnails —
all engineered to burn as few tokens as physics allows.

`Next.js 15 · TypeScript · Tailwind v4 · Three.js · filesystem-native`

</div>

---

## Why

Most people run AI as fourteen scattered tabs that forget them every session. Agentic OS is the
opposite: every agent lives in one sidebar, every agent reads and writes one markdown vault, every
piece of work lands in a previewable workspace, and every completed job makes tomorrow's agents
smarter. Local-first, single-tenant, and runs end-to-end with **zero API keys** on the built-in
mock adapter.

## The screens

| | |
|---|---|
| 🛰 **Mission Control** | Status of every agent, memory and signal — six live cards, agent grid, Today list, activity stream |
| 💬 **Agent panels** | Streaming chat + workspace + Control Room glass-box + Manage per agent; Hermes ships 14 sub-tabs incl. Goal Mode, Oracle, Muse, Apollo voice |
| 🗂 **Agent Kanban** | TRIAGE → TODO → READY → RUNNING → BLOCKED → DONE with dispatcher decomposition and blocked-with-question guardrails |
| ◎ **Goal Mode** | Launch a long-horizon goal, agent plans/works/checks for up to 50 turns, survives restarts, summarizes to the vault |
| 🧠 **Memory Galaxy** | Your Obsidian vault as a 3D star map — drag to orbit, click a star to open the note, recent notes burn brightest |
| 📈 **SEO Pipeline** | Real Search Console targets → 5 unique articles → 5 parallel deploys → indexing, looped |
| ❖ **Mastermind** | Every model at one table, all reading the same brain — @-tag or let the room answer |
| 🎬 **Studio** | Video crew (script → gate → avatar → edit → judge ≥8/10 → ship), games, music, thumbnails |

Full surface map: [docs/SCREENS.md](docs/SCREENS.md)

## Quick start

```bash
git clone https://github.com/<you>/agentic-os.git
cd agentic-os
npm ci
cp .env.example .env
npm run dev          # → http://localhost:3737/control
```

No keys needed — the mock adapter simulates streaming, tool calls, and runs so you can explore
every screen. Add keys to `.env` to light up real models:

```bash
OPENROUTER_API_KEY=sk-or-...    # free + budget tiers
ANTHROPIC_API_KEY=sk-ant-...    # tier 2
GEMINI_API_KEY=...
VAULT_PATH=/path/to/obsidian/vault
CONTROL_PASSCODE=...            # optional single-user lock
```

## Deploy on a CyberPanel VPS (4-core / 16 GB)

**Docker (recommended)** — app + Graphify memory engine as two containers sharing the host vault:

```bash
mkdir -p /srv/agentic-os/vault
docker compose up -d --build
```

**Bare metal / PM2** (built-in local indexer instead of the sidecar):

```bash
bash scripts/setup.sh
```

Either way, add an OpenLiteSpeed proxy context: URI `/control` → `http://127.0.0.1:3737`, issue
SSL, restart `lsws`. Full walkthrough with resource guardrails:
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** · Memory container topology:
**[docs/MEMORY.md](docs/MEMORY.md)**

## How it's built

- **AgentAdapter contract** — every harness (Claude Code, Hermes, OpenClaw, OpenRouter models,
  Fusion panel, mock) behind one interface; the UI never cares which is underneath
- **Obsidian vault as system of record** — plain markdown + `[[wikilinks]]`; agents read scoped
  context at session start, write outcomes at session end, with provenance
- **Memory Galaxy** — incremental indexer → `{nodes, edges}` → client-side Three.js star map
- **JSON-file state** — kanban, goals, sessions, token ledger, cron jobs in `data/*.json`,
  atomic writes; swap for SQLite later without touching call sites
- **SSE everywhere** — chat streaming and the Mission Control activity feed are server-sent events

Deep dive: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## The token doctrine (hard requirement)

| Rule | How |
|---|---|
| 90% of calls free/budget | Cost-tiered router: tier 0 local/free, tier 1 GLM-class, tier 2 frontier reserved for the hardest ~5% |
| Never reload transcripts | Sessions end by writing summary notes; new sessions load summaries |
| Delta memory writes | Append-only, with source provenance |
| Visible cost | Token ledger per call; daily total on Mission Control; per-run in Control Room |
| Zero-LLM shortcuts | Kanban moves, search, note opens are deterministic code paths |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — dev setup, how to add an agent (one registry entry),
how to add a screen, style rules, and the PR checklist. Security: [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
<sub>Inspired by the Agent OS system documented at agentos.guide. This is an independent
reimplementation — not affiliated with or endorsed by Julian Goldie.</sub>
</div>
