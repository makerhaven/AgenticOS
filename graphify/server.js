/**
 * Graphify — the Agentic OS memory-graph engine.
 *
 * Walks the Obsidian vault (read-only), builds the galaxy projection
 * (notes = stars, [[wikilinks]] = constellation lines), watches for changes,
 * and answers structural queries over HTTP. No database — the vault on disk
 * is the source of truth; this process holds the projection in RAM.
 *
 * Endpoints:
 *   GET /health
 *   GET /graph?folder=            → { nodes, edges, stats }   (paginate by folder)
 *   GET /neighbors/:slug?depth=2  → { nodes, edges } subgraph around one note
 *   GET /search?q=                → link-ranked note results
 *   GET /recent?window=48h        → recently touched notes (brightest stars)
 *   GET /stale?days=30            → notes not touched recently
 *   GET /stats                    → { noteCount, linkCount, clusters, builtAt }
 *   GET /events                   → SSE: note-added / note-changed / note-removed / graph-rebuilt
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const VAULT = path.resolve(process.env.VAULT_PATH || "/vault");
const PORT = Number(process.env.PORT || 4747);

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

/** @type {{ nodes: Map<string, any>, edges: [string, string][], builtAt: string }} */
let graph = { nodes: new Map(), edges: [], builtAt: new Date().toISOString() };
const sseClients = new Set();

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function extractLinks(content) {
  const out = [];
  let m;
  while ((m = WIKILINK_RE.exec(content)) !== null) out.push(m[1].split("|")[0].trim());
  return out;
}

function walk(dir, base, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, acc);
    else if (entry.name.endsWith(".md")) acc.push(path.relative(base, full));
  }
  return acc;
}

function rebuild() {
  const nodes = new Map();
  const files = walk(VAULT, VAULT);

  for (const rel of files) {
    const full = path.join(VAULT, rel);
    let content = "";
    try {
      content = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    const slug = rel.replace(/\.md$/, "");
    const stat = fs.statSync(full);
    nodes.set(slug, {
      id: slug,
      title: path.basename(rel, ".md"),
      folder: path.dirname(rel) === "." ? "" : path.dirname(rel),
      lastTouched: stat.mtime.toISOString(),
      links: extractLinks(content),
      snippet: content.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/[#*`>\[\]]/g, "").trim().slice(0, 200),
      degree: 0,
    });
  }

  // Resolve wikilinks → slugs (Obsidian rules: title match or path match)
  const byTitle = new Map();
  const bySlugLower = new Map();
  for (const n of nodes.values()) {
    byTitle.set(n.title.toLowerCase(), n.id);
    bySlugLower.set(n.id.toLowerCase(), n.id);
  }

  const edges = [];
  for (const n of nodes.values()) {
    for (const link of n.links) {
      const target = byTitle.get(link.toLowerCase()) ?? bySlugLower.get(link.toLowerCase());
      if (!target || target === n.id) continue;
      edges.push([n.id, target]);
      nodes.get(n.id).degree++;
      nodes.get(target).degree++;
    }
  }

  graph = { nodes, edges, builtAt: new Date().toISOString() };
  broadcast({ type: "graph-rebuilt", noteCount: nodes.size, linkCount: edges.length });
  console.log(`[graphify] rebuilt: ${nodes.size} notes, ${edges.length} links`);
}

function broadcast(event) {
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(line);
    } catch {
      sseClients.delete(res);
    }
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

function getNeighbors(slug, depth = 2) {
  const adj = new Map();
  for (const [a, b] of graph.edges) {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  }
  const seen = new Set([slug]);
  let frontier = [slug];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const id of frontier) {
      for (const nb of adj.get(id) ?? []) {
        if (!seen.has(nb)) {
          seen.add(nb);
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  const nodes = [...seen].map((id) => graph.nodes.get(id)).filter(Boolean);
  const edges = graph.edges.filter(([a, b]) => seen.has(a) && seen.has(b));
  return { nodes, edges };
}

function search(q) {
  const needle = q.toLowerCase();
  return [...graph.nodes.values()]
    .filter(
      (n) =>
        n.title.toLowerCase().includes(needle) ||
        n.snippet.toLowerCase().includes(needle) ||
        n.folder.toLowerCase().includes(needle)
    )
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 25)
    .map(({ links, ...n }) => n);
}

function recent(windowMs) {
  const cutoff = Date.now() - windowMs;
  return [...graph.nodes.values()]
    .filter((n) => new Date(n.lastTouched).getTime() >= cutoff)
    .sort((a, b) => b.lastTouched.localeCompare(a.lastTouched))
    .map(({ links, ...n }) => n);
}

function stale(days) {
  const cutoff = Date.now() - days * 86400000;
  return [...graph.nodes.values()]
    .filter((n) => new Date(n.lastTouched).getTime() < cutoff)
    .sort((a, b) => a.lastTouched.localeCompare(b.lastTouched))
    .map(({ links, snippet, ...n }) => n);
}

function stats() {
  const folders = new Map();
  for (const n of graph.nodes.values()) {
    const f = n.folder || "root";
    folders.set(f, (folders.get(f) ?? 0) + 1);
  }
  return {
    noteCount: graph.nodes.size,
    linkCount: graph.edges.length,
    clusters: [...folders.entries()].map(([folder, count]) => ({ folder, count })),
    builtAt: graph.builtAt,
  };
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const send = (code, body) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === "/health") return send(200, { ok: true, vault: VAULT });

  if (url.pathname === "/graph") {
    const folder = url.searchParams.get("folder");
    let nodes = [...graph.nodes.values()].map(({ links, snippet, ...n }) => n);
    if (folder) nodes = nodes.filter((n) => n.folder === folder);
    const ids = new Set(nodes.map((n) => n.id));
    const edges = graph.edges
      .filter(([a, b]) => ids.has(a) && ids.has(b))
      .map(([source, target]) => ({ source, target }));
    return send(200, { nodes, edges, stats: stats() });
  }

  if (url.pathname.startsWith("/neighbors/")) {
    const slug = decodeURIComponent(url.pathname.slice("/neighbors/".length));
    const depth = Number(url.searchParams.get("depth") ?? 2);
    if (!graph.nodes.has(slug)) return send(404, { error: "unknown note" });
    const { nodes, edges } = getNeighbors(slug, depth);
    return send(200, {
      nodes: nodes.map(({ links, snippet, ...n }) => n),
      edges: edges.map(([source, target]) => ({ source, target })),
    });
  }

  if (url.pathname === "/search") return send(200, { results: search(url.searchParams.get("q") ?? "") });

  if (url.pathname === "/recent") {
    const w = url.searchParams.get("window") ?? "48h";
    const ms = w.endsWith("h") ? parseInt(w) * 3600000 : w.endsWith("d") ? parseInt(w) * 86400000 : 172800000;
    return send(200, { notes: recent(ms) });
  }

  if (url.pathname === "/stale") return send(200, { notes: stale(Number(url.searchParams.get("days") ?? 30)) });

  if (url.pathname === "/stats") return send(200, stats());

  if (url.pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(`data: ${JSON.stringify({ type: "hello", builtAt: graph.builtAt })}\n\n`);
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  send(404, { error: "unknown endpoint" });
});

// ---------------------------------------------------------------------------
// Boot + watch
// ---------------------------------------------------------------------------

rebuild();

let pending = new Set();
let debounce = null;

chokidar
  .watch(VAULT, { ignoreInitial: true, depth: 12 })
  .on("add", (p) => onChange(p, "note-added"))
  .on("change", (p) => onChange(p, "note-changed"))
  .on("unlink", (p) => onChange(p, "note-removed"));

function onChange(p, type) {
  if (!p.endsWith(".md")) return;
  pending.add(p);
  broadcast({ type, file: path.relative(VAULT, p) });
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    // Bulk change (>50 files in the window) → full rebuild; else same here for
    // simplicity at vault scale — a 10k-note rebuild is seconds on this box.
    rebuild();
    pending.clear();
  }, 800);
}

server.listen(PORT, () => {
  console.log(`[graphify] listening on :${PORT}, vault at ${VAULT}`);
});
