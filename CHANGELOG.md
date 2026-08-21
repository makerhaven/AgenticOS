# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-08-19

Initial release. The full command center:

### Screens
- **Mission Control** — six live status cards (Claude, OpenClaw, Hermes, Heartbeat, Latency, Free Claude), agent control-room grid, Today list, SSE live activity stream.
- **Agent panels** — per-agent pill-tab surfaces (Hermes ships 14: Chat, Apollo, Oracle, Muse, Astros, Studio, Sessions, Outreach, Mixture, Workspace, MCPs, Manage, Control Room, Goal Mode). Streaming chat with tool-call chips, context meter, memory scope.
- **Control Room** — the read-only "glass box": ordered run steps, red-lit failures, per-step input/output/timing/tokens, skills panel, model-switch timeline, redacted markdown/JSON export.
- **Agent Kanban** — TRIAGE / TODO / READY / RUNNING / BLOCKED / DONE, dispatcher decomposition, blocked-with-question guardrail, done-summary written to the vault journal, board variants (`?board=video-studio`).
- **Goal Mode** — "Set the target. Walk away." Launch, turn-capped runs (max 50), live log, stop/tick controls, vault summary on completion.
- **Memory** — Recent / Notes / Omi / Graph tabs over the Obsidian vault; note reader; **Memory Galaxy** — Three.js 3D star map (drag orbit, scroll zoom, click star, double-click pause; recency = brightness).
- **SEO Content Pipeline** — Research (GSC striking-distance + CTR-leak tables), Generate (keyword + slug + transcript picker + auto-deploy toggle), Deploy, History, Transcripts, Skill.
- **Mastermind** — multi-model group chat with @-tagging.
- **Studio** — Music / Video / Game / Thumbnail modes with the writer→gate→avatar→edit→judge→ship pipeline stepper.
- **Journal, Notebook, Pipeline, Paperclip, Settings** — daily journal from the vault, research notebooks, staged pipeline runner with approval gate, attachment inbox, and the router/vault/scheduler/keys settings hub.

### Platform
- Next.js 15 App Router + TypeScript + Tailwind CSS v4, mounted at `/control` (`basePath`).
- `AgentAdapter` contract with 11 agents + mock adapter (full UI with zero keys).
- Obsidian vault as system of record + incremental graph indexer.
- JSON-file state store (kanban, goals, today, sessions, token ledger, cron jobs).
- Cost-tiered model routing doctrine (tier 0 free/local, tier 1 budget, tier 2 premium) with token ledger.
- Optional `CONTROL_PASSCODE` single-user lock (middleware + lock screen).
- PWA manifest + mobile bottom nav (Pocket Mission Control).
- PM2 ecosystem config, `scripts/setup.sh`, CyberPanel/OpenLiteSpeed deployment docs.
