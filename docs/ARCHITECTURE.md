# Architecture

Agentic OS is a single Next.js 15 server that plays four roles at once: web UI, agent orchestrator, memory index, and scheduler. One process, one port, one screen.

```
┌────────────────────────────────────────────────────────────┐
│  Browser (desktop + phone PWA)                             │
│  /control — sidebar shell, 14 screens, ⌘K palette          │
└──────────────┬─────────────────────────────────────────────┘
               │ HTTP + SSE
┌──────────────▼─────────────────────────────────────────────┐
│  Next.js 15 (App Router, basePath /control, :3737)         │
│                                                            │
│  app/api/ ──────────────┬───────────────────────────┐      │
│                         │                           │      │
│  lib/adapters.ts   lib/store.ts            lib/indexer.ts  │
│  AgentAdapter      JSON-file state         vault → graph   │
│  contract + mock   (kanban, goals,          (Memory Galaxy)│
│  + real harnesses   sessions, ledger, jobs)                │
│                         │                           │      │
│  lib/events.ts     lib/vault.ts                         │
│  SSE activity bus  Obsidian markdown R/W, wikilinks,       │
│                    journal append, provenance              │
└──────────────┬─────────────────────────────────────────────┘
               │
   ┌───────────▼────────────┐      ┌─────────────────────┐
   │  vault/ (plain .md)     │      │  workspaces/<agent>/ │
   │  Goals Journal Business │      │  scratch + outputs   │
   │  Context Decisions      │      │  (agent scratch dirs)│
   │  Memory inbox           │      └─────────────────────┘
   └─────────────────────────┘
```

## The AgentAdapter contract

Every agent — Claude Code CLI, Hermes, OpenClaw, a bare OpenRouter model, the Fusion panel — sits behind one interface (`lib/adapters.ts`):

```ts
status()  → { online, version, latencyMs, model, provider }
chat(sessionId, message) → AsyncIterable<ChatEvent>  // tokens, tool calls
```

The UI never knows which harness is behind a tab. The **mock adapter** implements the same contract with simulated streaming + tool calls, which is why the entire OS runs with zero API keys — and why adding a real harness is a one-file change.

## Why JSON files instead of a database

Single-tenant, low write volume, and the source system is explicitly filesystem-native (the vault *is* the memory). `lib/store.ts` does atomic write-rename into `data/*.json`. If you outgrow it, the store is one module — swap internals, keep the call sites.

## Memory: two layers

1. **System of record** — the Obsidian vault: plain markdown + `[[wikilinks]]` + frontmatter. Agents read scoped context at session start, write outcomes at session end. `lib/vault.ts`.
2. **Projection** — `lib/indexer.ts` walks the vault, extracts wikilinks, emits `{nodes, edges}`; `components/Galaxy.tsx` renders it as the 3D Memory Galaxy (Three.js, client-side so the server never does graph math per request). Cached 15s, rebuilt on demand.

## The loop (how it compounds)

```
kanban card → dispatcher → worker agent → output to workspace
     │                                        │
     ▼                                        ▼
 blocked? ask user              done → summary → vault Journal
     │                                        │
     └──────── answer on card ──┘            ▼
                                 tomorrow's agents read it
```

Every completed piece of work becomes context for the next one. That's the whole trick.

## Token-minimization (hard requirement)

- **Tiered router** — tier 0 free/local, tier 1 budget (GLM-class), tier 2 premium, picked per call by capability need. Target ≥90% on tiers 0–1.
- **Summaries over transcripts** — sessions end by writing a short summary note; new sessions load summaries.
- **Delta memory writes** — append-only, with provenance.
- **Context meter + auto-compact at 70%** — visible in every chat rail.
- **Deterministic short-circuits** — kanban moves, note opens, searches never touch an LLM.
- **Token ledger** — every call logged; daily total on Mission Control.
