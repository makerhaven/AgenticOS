# Screens — the /control surface map

Every screen lives under `/control` inside the shared shell (sidebar + topbar + ⌘K palette + mobile bottom nav).

| Route | Screen | What it does |
|---|---|---|
| `/control` | **Mission Control** | Home. Six status cards (Claude, OpenClaw, Hermes, Heartbeat, Latency p50, Free Claude), agent control-room grid, Today list, live activity stream. |
| `/control/agents/[id]` | **Agent panel** | Per-agent surface. Shared pattern: Chat (streaming, tool chips, context meter), Workspace (files + inline preview), Control Room (glass-box run inspector), Manage (model profiles, surfaces). Hermes adds 10 more pills: Apollo voice, Oracle, Muse, Astros, Studio, Sessions, Outreach, Mixture, MCPs, Goal Mode. |
| `/control/kanban` | **Agent Kanban** | TRIAGE → TODO → READY → RUNNING → BLOCKED → DONE. `⚡ Dispatch now` decomposes triage into subtasks. Blocked cards carry the agent's question; answering resumes. Done demands a summary → written to the vault. `?board=video-studio` for the video pipeline variant. |
| `/control/goals` | **Goal Mode** | "Set the target. Walk away." Launch long-horizon goals (turn-capped at 50), watch plan → work → check with live logs, stop anytime. Survives restarts. |
| `/control/memory` | **Memory** | Recent / Notes / Omi / Graph tabs over the Obsidian vault. **Graph = Memory Galaxy**: 3D star map — every note a star, every wikilink a constellation line, recent notes burn brightest. Drag orbit, scroll zoom, click a star to open. |
| `/control/seo` | **SEO Content Pipeline** | Research (GSC striking distance + CTR leaks) → Generate (keyword + transcript → 5 unique articles) → Deploy (5 sites in parallel) → indexing. History of every run. |
| `/control/mastermind` | **AI Agent Mastermind** | Group chat with every model at one table, all reading the vault. @-tag one or let the room answer. |
| `/control/studio` | **Studio** | Music / Video / Game / Thumbnail. Video runs the crew: brief → script gate → avatar render → dopamine edit → judge 1–10 → loops until ≥8. Outputs land in the gallery. |
| `/control/pipeline` | **Pipeline** | Multi-stage runner: Triage → Approve (gate) → Build → Ship. One approval before anything ships. |
| `/control/notebook` | **Notebook** | Research notebooks + generated assets (audio overviews, mind maps, briefings), pulled into the workspace. |
| `/control/journal` | **Journal** | The auto-logged daily build journal — one page per day, fed by every agent run and kanban completion. |
| `/control/paperclip` | **Paperclip** | Inbound inbox. Dropped files are filed into `vault/inbox/` and routed to the right agent. |
| `/control/settings` | **Settings** | Model router table (tier 0–2, drag priority), vault path, scheduler (Oracle / Muse crons), key presence, surface toggles, setup checker. |
| `/control/lock` | **Lock** | Passcode gate when `CONTROL_PASSCODE` is set. |

## Design language cheatsheet

- Eyebrow: Caveat, gold, Roman numeral (`XIII. — SELF · KANBAN`)
- Title: Bricolage Grotesque 700, `clamp(2.2rem, 4.5vw, 3.6rem)`, `-0.035em`
- Meta row: JetBrains Mono, gold-deep, `15:10 · LOCAL · STUDIO`
- Cards: 18px radius, bg-card→bg-mid gradient, gold hairline, hover `-translate-y-1`
- Status: emerald dot = online, plum = offline, gold = idle/warning
- Dividers: fading hairline with a centered gold `✦`
