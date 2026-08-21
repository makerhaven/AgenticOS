# Contributing to Agentic OS

Thanks for helping make the one-screen AI team better. This project is a self-hosted command center for AI agents — keep contributions aligned with its two hard rules:

1. **Local-first.** Everything must run with zero external keys on the mock adapter. Cloud integrations are always optional.
2. **Token-minimal.** Any feature that calls an LLM must go through the cost-tiered router (`lib/adapters.ts`) and log to the token ledger. Never load raw transcripts when a summary note exists.

## Dev setup

```bash
npm ci
cp .env.example .env
npm run dev        # → http://localhost:3737/control
```

## Project layout

| Path | What lives there |
|---|---|
| `app/(control)/control/` | All screens (the app mounts at `/control` via `basePath`) |
| `app/api/` | Route handlers — SSE for chat + activity |
| `lib/vault.ts` | Obsidian vault read/write (plain markdown, `[[wikilinks]]`) |
| `lib/indexer.ts` | Vault → Memory Galaxy graph projection |
| `lib/adapters.ts` | The `AgentAdapter` contract + all adapters incl. `mock` |
| `lib/store.ts` | JSON-file state (kanban, goals, today, sessions, ledger, jobs) |
| `lib/events.ts` | In-process SSE activity bus |
| `components/` | Shell, command palette, Galaxy, UI primitives |

## Adding a new agent

1. Add the definition to `AGENTS` in `lib/agents.ts` (id, name, role, glyph, hue, tabs).
2. Add a case to `getAgentStatuses()` and `chatWithAgent()` in `lib/adapters.ts` — or a real adapter class implementing the contract.
3. Done — the sidebar, command palette, and agent panel pick it up automatically.

## Adding a screen

1. Create `app/(control)/control/<name>/page.tsx`.
2. Add the nav entry to `NAV` in `components/Shell.tsx` and a search item in `components/CommandPalette.tsx`.
3. Use the shared primitives from `components/ui.tsx` (`PageHeader`, `Card`, `Pill`, `GoldButton`) — don't invent new card styles.

## Style rules

- Palette tokens only (`bg-deep`, `gold`, `cream`, …) — no raw hex in components.
- Eyebrows are Caveat + gold with a Roman numeral; headings are Bricolage Grotesque with `-0.035em` tracking; metrics are JetBrains Mono.
- Server components by default; `"use client"` only where interactive.
- No new runtime dependency without a strong reason — the 4-core VPS is the target hardware.

## PR checklist

- [ ] `npm run build` passes clean
- [ ] UI works with zero API keys (mock adapter)
- [ ] New LLM calls route through the tier router and write to the ledger
- [ ] Any vault write cites its source (provenance rule)
