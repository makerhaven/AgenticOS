import "server-only";

import { listNotes } from "./vault";

/**
 * Memory Galaxy index — the graph projection of the Obsidian vault.
 *
 * Two modes:
 *  - Docker (production): proxies the `graphify` sidecar container at
 *    GRAPHIFY_URL (http://graphify:4747) — the graph lives in that service's
 *    RAM, kept warm across app restarts, rebuilt off the request path.
 *  - Local fallback (dev / non-Docker): walks the vault itself and builds the
 *    same shape, cached for 15s.
 */

export interface GalaxyNode {
  id: string;
  title: string;
  folder: string;
  lastTouched: string;
  degree: number;
}

export interface GalaxyEdge {
  source: string;
  target: string;
}

export interface GalaxyData {
  nodes: GalaxyNode[];
  edges: GalaxyEdge[];
  noteCount: number;
  linkCount: number;
  builtAt: string;
  engine: "graphify" | "local";
}

const GRAPHIFY_URL = process.env.GRAPHIFY_URL; // e.g. http://graphify:4747

let cache: { data: GalaxyData; builtAt: number } | null = null;
const TTL_MS = 15_000;

async function fromGraphify(): Promise<GalaxyData | null> {
  if (!GRAPHIFY_URL) return null;
  try {
    const res = await fetch(`${GRAPHIFY_URL}/graph`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      nodes: GalaxyNode[];
      edges: GalaxyEdge[];
      stats: { noteCount: number; linkCount: number; builtAt: string };
    };
    return {
      nodes: body.nodes,
      edges: body.edges,
      noteCount: body.stats.noteCount,
      linkCount: body.stats.linkCount,
      builtAt: body.stats.builtAt,
      engine: "graphify",
    };
  } catch {
    return null; // sidecar down → fall back locally, stay up
  }
}

function buildLocal(): GalaxyData {
  const notes = listNotes();
  const byTitle = new Map<string, string>();
  const bySlug = new Map<string, string>();
  for (const n of notes) {
    byTitle.set(n.title.toLowerCase(), n.slug);
    bySlug.set(n.slug.toLowerCase(), n.slug);
  }

  const edges: GalaxyEdge[] = [];
  const degree = new Map<string, number>();

  for (const n of notes) {
    for (const link of n.links) {
      const target = byTitle.get(link.toLowerCase()) ?? bySlug.get(link.toLowerCase());
      if (!target || target === n.slug) continue;
      edges.push({ source: n.slug, target });
      degree.set(n.slug, (degree.get(n.slug) ?? 0) + 1);
      degree.set(target, (degree.get(target) ?? 0) + 1);
    }
  }

  return {
    nodes: notes.map((n) => ({
      id: n.slug,
      title: n.title,
      folder: n.folder,
      lastTouched: n.mtime,
      degree: degree.get(n.slug) ?? 0,
    })),
    edges,
    noteCount: notes.length,
    linkCount: edges.length,
    builtAt: new Date().toISOString(),
    engine: "local",
  };
}

export async function buildGalaxy(force = false): Promise<GalaxyData> {
  if (!force && cache && Date.now() - cache.builtAt < TTL_MS) return cache.data;

  const remote = await fromGraphify();
  const data = remote ?? buildLocal();

  cache = { data, builtAt: Date.now() };
  return data;
}

/** Structural context for agent sessions — neighbors around a topic note. */
export async function neighbors(slug: string, depth = 2): Promise<{ nodes: GalaxyNode[]; edges: GalaxyEdge[] }> {
  if (GRAPHIFY_URL) {
    try {
      const res = await fetch(
        `${GRAPHIFY_URL}/neighbors/${encodeURIComponent(slug)}?depth=${depth}`,
        { signal: AbortSignal.timeout(4000), cache: "no-store" }
      );
      if (res.ok) return (await res.json()) as { nodes: GalaxyNode[]; edges: GalaxyEdge[] };
    } catch {
      /* fall through */
    }
  }
  const g = await buildGalaxy();
  const adj = new Map<string, Set<string>>();
  for (const e of g.edges) {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }
  const seen = new Set([slug]);
  let frontier = [slug];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
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
  return {
    nodes: g.nodes.filter((n) => seen.has(n.id)),
    edges: g.edges.filter((e) => seen.has(e.source) && seen.has(e.target)),
  };
}

/** Recently-touched notes — session-start context ("brightest stars"). */
export async function recentNotes(windowMs = 48 * 3600_000): Promise<GalaxyNode[]> {
  if (GRAPHIFY_URL) {
    try {
      const hours = Math.round(windowMs / 3600_000);
      const res = await fetch(`${GRAPHIFY_URL}/recent?window=${hours}h`, {
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as { notes: GalaxyNode[] };
        return body.notes;
      }
    } catch {
      /* fall through */
    }
  }
  const cutoff = Date.now() - windowMs;
  const g = await buildGalaxy();
  return g.nodes
    .filter((n) => new Date(n.lastTouched).getTime() >= cutoff)
    .sort((a, b) => b.lastTouched.localeCompare(a.lastTouched));
}
