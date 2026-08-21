# Memory Architecture — Obsidian + Graphify, two containers, one brain

Agentic OS splits memory into two cooperating services, each in its own Docker container:

| Container | Role | Image base | Exposes |
|---|---|---|---|
| `agentic-os` | The command center — UI, agents, kanban, goals, indexer client | `node:20-alpine` | `3737` (proxied at `/control`) |
| `graphify` | The graph engine — walks the vault, builds + serves the galaxy projection, answers structural queries (neighbors, paths, clusters, stale notes) | `node:20-alpine` | `4747` (internal only) |

The **Obsidian vault is a folder on the host**, bind-mounted into both containers. It stays plain markdown — either container can die, restart, or be rebuilt and the brain survives untouched.

```
                    ┌─────────────────────────── Host (4-core / 16 GB VPS) ───────────────────────────┐
                    │                                                                                  │
  Browser/phone     │   ┌──────────────────────┐         ┌──────────────────────┐                     │
  ─────────────►    │   │   agentic-os:3737    │  HTTP   │    graphify:4747     │                     │
  OpenLiteSpeed     │   │  ──────────────────  │ ──────► │  ──────────────────  │                     │
  proxy /control    │   │  UI · adapters ·     │  /graph │  indexer · watcher   │                     │
                    │   │  kanban · goals ·    │  /query │  graph store (RAM)   │                     │
                    │   │  scheduler · SSE     │  /stats │  change feed (SSE)   │                     │
                    │   └─────────┬────────────┘         └──────────┬───────────┘                     │
                    │             │                                 │                                  │
                    │             │  bind mount (rw)                │  bind mount (ro)                 │
                    │             ▼                                 ▼                                  │
                    │   ┌──────────────────────────────────────────────────────┐                     │
                    │   │   /srv/agentic-os/vault   (plain markdown .md)        │                     │
                    │   │   Goals/ Journal/ Business Context/ Decisions/        │                     │
                    │   │   Memory/ inbox/                                      │                     │
                    │   └──────────────────────────────────────────────────────┘                     │
                    │                                                                                  │
                    │   docker network: agentic-net (bridge, internal)                                │
                    └──────────────────────────────────────────────────────────────────────────────────┘
```

## Why split it

1. **The graph math stays off the request path.** Graphify holds the whole projection in RAM and answers in microseconds; the Next.js process never walks 10k markdown files mid-request. On a 4-core box this separation is what keeps Mission Control snappy while the galaxy rebuilds.
2. **Independent restarts.** Rebuild/redeploy the app without losing the warm graph; restart the graph without dropping agent chat sessions.
3. **The source of truth never moves.** The vault is files on disk. Obsidian (desktop, phone sync, git) can read/write the same folder concurrently — markdown has no lock.

## The contract (what flows between the containers)

### 1. Vault access — the shared mount

| Concern | `agentic-os` | `graphify` |
|---|---|---|
| Mount | `/vault` **read-write** | `/vault` **read-only** |
| Why | Agents write outcomes, journal entries, kanban summaries | Pure reader — builds the projection, never mutates memory |
| Env | `VAULT_PATH=/vault` | `VAULT_PATH=/vault` |

Read-only on the graph side is deliberate: **only agents write memory**. A graph engine bug can never corrupt your brain.

### 2. Graph API — how the app reads the projection

`agentic-os` calls Graphify over the internal Docker network (`GRAPHIFY_URL=http://graphify:4747`). The app's `lib/indexer.ts` is a thin client of this API (with a built-in local fallback for non-Docker dev).

| Endpoint | Returns | Used by |
|---|---|---|
| `GET /graph` | `{ nodes:[{id,title,folder,lastTouched,degree}], edges:[{source,target}], stats }` | Memory Galaxy page (3D render is client-side; server just fetches JSON) |
| `GET /neighbors/:slug?depth=2` | Subgraph around one note | Agent context assembly — "what's near this topic" |
| `GET /search?q=…` | Title + snippet + link-ranked results | ⌘K palette, Notes tab |
| `GET /recent?window=48h` | Recently touched notes (brightest stars) | Session-start context for agents |
| `GET /stale?days=30` | Notes not touched recently | Control Room "stale memory" diagnostics |
| `GET /stats` | `{ noteCount, linkCount, clusters, builtAt }` | Mission Control vault card |
| `GET /events` (SSE) | `note-added / note-changed / note-removed / graph-rebuilt` | Live galaxy updates; triggers incremental re-index |

### 3. The write-back loop — how context flows the other way

Agents never talk to Graphify for *writes*. The loop is:

```
agent finishes work
  → agentic-os writes summary/decision to /vault (rw mount)
  → graphify's chokidar watcher sees the file change (ro mount)
  → incremental re-index of that note + its wikilinks
  → SSE event → open Galaxy tabs live-update
  → next agent session calls GET /recent + /neighbors → sees the new note
```

This is the compounding loop made explicit: **write markdown → graph updates → next agent reads the graph**. No database to sync, no drift between "the memory" and "the map of the memory."

## How agents actually use it (context assembly per session)

When a chat session starts, the adapter builds context in this order — cheapest first, frontier tokens last:

1. `GET /recent?window=48h` — what changed lately (a few hundred tokens)
2. The agent's scope manifest — stable preamble (prompt-cache friendly)
3. `GET /neighbors/<topic>` for the task's seed entities — 1–2 hops of linked notes
4. Summaries of those notes — **never raw transcripts** (the token doctrine)
5. Only if the task demands it: full note bodies, then a final tier-2 model call for the hard part

Session end: append-only summary write to `Journal/` + `Memory/<agent>/` with `source:` frontmatter pointing at the session id.

## Graphify service spec (what runs in the second container)

A ~200-line Node service. Reference implementation lives at `graphify/server.js` in this repo — drop-in, or replace with any service honoring the same HTTP contract.

- **Indexer:** walks `/vault/**/*.md`, strips frontmatter, extracts `[[wikilinks]]`, resolves them to slugs (title- or path-match, Obsidian rules), emits nodes + edges.
- **Watcher:** chokidar on `/vault`; change → re-index just that note's edges (add/remove/relink) and broadcast on `/events`. Full rebuild only on bulk changes (>50 files in 5s) or on boot.
- **Store:** in-memory adjacency maps; no database. Cold start on 10k notes is a few seconds on the 4-core box.
- **Clustering:** folders are first-class clusters (that's what colors the galaxy); optional label-propagation pass exposes `clusters` in `/stats`.
- **Recency scoring:** each node carries `lastTouched` (mtime + journal references); the galaxy maps it to brightness.

## Docker wiring

`docker-compose.yml` (included in this repo):

```yaml
services:
  agentic-os:
    build: .
    ports: ["127.0.0.1:3737:3737"]
    environment:
      VAULT_PATH: /vault
      GRAPHIFY_URL: http://graphify:4747
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:-}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      CONTROL_PASSCODE: ${CONTROL_PASSCODE:-}
      MAX_CONCURRENT_RUNS: "3"
    volumes:
      - /srv/agentic-os/vault:/vault          # rw — agents write memory
      - agentic-data:/app/data                # kanban, goals, sessions, ledger
    depends_on: [graphify]
    networks: [agentic-net]
    restart: unless-stopped
    mem_limit: 2g

  graphify:
    build: ./graphify
    expose: ["4747"]                           # internal only — never public
    environment:
      VAULT_PATH: /vault
    volumes:
      - /srv/agentic-os/vault:/vault:ro        # ro — the graph can never corrupt memory
    networks: [agentic-net]
    restart: unless-stopped
    mem_limit: 512m

networks:
  agentic-net:
    driver: bridge

volumes:
  agentic-data:
```

Key properties:

- **Graphify is not published to the host** (`expose`, not `ports`) — only reachable from `agentic-os` on the bridge network. One public surface: the app, through OpenLiteSpeed at `/control`.
- **The vault lives on the host at `/srv/agentic-os/vault`** — outside both containers. Point `VAULT_PATH` there, or symlink your real Obsidian vault.
- **Memory ceilings fit the 16 GB box with headroom** for CyberPanel + OLS + MySQL.

## CyberPanel deployment note

On the CyberPanel box, run both containers under one compose project; OpenLiteSpeed proxies only `agentic-os:3737`. Graphify needs no TLS, no vHost, no port mapping — it's a private backend. `docs/DEPLOYMENT.md` covers the OLS context; the compose file replaces the PM2 path when you go Docker (use one or the other, not both).

## Failure behavior

| If… | Then |
|---|---|
| `graphify` is down | App stays up. Galaxy shows last-cached graph; `/recent` falls back to filesystem mtimes; banner shows "graph engine offline". Nothing blocks chat or kanban. |
| `agentic-os` restarts | Graph is untouched; sessions reload from `data/`; warm galaxy instant. |
| Vault grows to 50k notes | Graphify memory ~a few hundred MB; `/graph` is paginated by folder; galaxy renders clusters-first. |
| Obsidian edits the vault while agents run | Watcher picks it up within a second; next agent session sees it. Concurrent writes are last-write-wins at the file level — plain markdown semantics. |
