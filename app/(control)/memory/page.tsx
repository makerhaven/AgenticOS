"use client";

import React from "react";
import { Brain, Clock, FileText, Radio, Network, Sparkles, RefreshCw } from "lucide-react";
import { PageHeader, Card, Pill, Input, EmptyState } from "@/components/ui";
import dynamic from "next/dynamic";

interface VaultNote {
  slug: string;
  title: string;
  folder: string;
  mtime: string;
  snippet: string;
  links: string[];
}

interface GalaxyData {
  nodes: { id: string; title: string; folder: string; lastTouched: string; degree: number }[];
  edges: { source: string; target: string }[];
  noteCount: number;
  linkCount: number;
  builtAt: string;
}

const Galaxy = dynamic(() => import("@/components/Galaxy"), {
  ssr: false,
  loading: () => (
    <div className="h-[560px] flex items-center justify-center rounded-2xl bg-[#0a0612]">
      <span className="font-mono text-xs text-gold">Igniting the galaxy…</span>
    </div>
  ),
});

export default function MemoryPage() {
  const [tab, setTab] = React.useState<"recent" | "notes" | "omi" | "graph">("graph");
  const [notes, setNotes] = React.useState<VaultNote[]>([]);
  const [galaxy, setGalaxy] = React.useState<GalaxyData | null>(null);
  const [q, setQ] = React.useState("");
  const [openNote, setOpenNote] = React.useState<{ slug: string; content: string } | null>(null);

  const loadNotes = React.useCallback(() => {
    fetch(`/control/api/memory/notes${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes))
      .catch(() => {});
  }, [q]);

  const loadGalaxy = React.useCallback((force = false) => {
    fetch(`/control/api/memory/graph${force ? "?refresh=1" : ""}`)
      .then((r) => r.json())
      .then(setGalaxy)
      .catch(() => {});
  }, []);

  React.useEffect(loadNotes, [loadNotes]);
  React.useEffect(() => {
    loadGalaxy();
  }, [loadGalaxy]);

  const openSlug = async (slug: string) => {
    const r = await fetch(`/control/api/memory/notes?slug=${encodeURIComponent(slug)}`);
    if (r.ok) setOpenNote(await r.json());
  };

  const omiCount = 1261;

  return (
    <div>
      <PageHeader
        numeral="XV."
        section="Self · Memory"
        title="Memory"
        subtitle={`Search ${omiCount.toLocaleString()} Omi memories + your Obsidian vault.`}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div className="flex items-center gap-2">
            <Brain size={15} className="text-emerald" />
            <span className="font-display font-medium text-emerald text-sm">
              Memory — Obsidian Vault
            </span>
          </div>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] text-gold">
            {omiCount.toLocaleString()} OMI · {notes.length} NOTES
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <Pill active={tab === "recent"} onClick={() => setTab("recent")}>
              <Clock size={12} /> Recent {notes.length > 0 && <span className="font-mono text-[10px]">{Math.min(notes.length, 12)}</span>}
            </Pill>
            <Pill active={tab === "notes"} onClick={() => setTab("notes")}>
              <FileText size={12} /> Notes
            </Pill>
            <Pill active={tab === "omi"} onClick={() => setTab("omi")}>
              <Radio size={12} /> Omi
            </Pill>
            <Pill active={tab === "graph"} onClick={() => setTab("graph")} tone="gold">
              <Network size={12} /> Graph
            </Pill>
          </div>
          <button
            onClick={() => {
              setTab("graph");
              loadGalaxy(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-plum/50 px-4 py-1.5 text-sm text-plum hover:bg-plum/10 transition-colors"
          >
            <Sparkles size={13} /> Galaxy✦
          </button>
        </div>

        <div className="p-5 pt-2">
          {tab === "graph" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-mono text-xs text-gold">
                  {galaxy ? `${galaxy.noteCount} stars · ${galaxy.linkCount} links` : "…"}
                </div>
                <button
                  onClick={() => loadGalaxy(true)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream-mute hover:text-cream"
                >
                  <RefreshCw size={11} /> Rebuild
                </button>
              </div>
              {galaxy && <Galaxy data={galaxy} onOpen={openSlug} />}
            </div>
          )}

          {(tab === "notes" || tab === "recent") && (
            <div>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the vault…"
                className="mb-4"
              />
              {notes.length === 0 ? (
                <EmptyState icon="✦" text="The vault is empty. Point VAULT_PATH at your Obsidian vault and it fills." />
              ) : (
                <div className="space-y-2">
                  {(tab === "recent" ? notes.slice(0, 12) : notes).map((n) => (
                    <button
                      key={n.slug}
                      onClick={() => openSlug(n.slug)}
                      className="w-full text-left rounded-xl border border-line-soft bg-bg-deep/40 px-4 py-3 hover:border-gold/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-medium text-cream text-sm">{n.title}</span>
                        <span className="font-mono text-[10px] text-cream-mute">
                          {n.folder && `${n.folder} · `}
                          {new Date(n.mtime).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-xs text-cream-dim line-clamp-2">{n.snippet}</p>
                      {n.links.length > 0 && (
                        <div className="mt-1.5 font-mono text-[10px] text-gold-deep">
                          → {n.links.slice(0, 3).join(", ")}
                          {n.links.length > 3 ? ` +${n.links.length - 3}` : ""}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "omi" && (
            <EmptyState
              icon="◉"
              text="Omi passive capture lands here — conversations from your day, logged and searchable. Connect an Omi device to light this up."
            />
          )}
        </div>
      </Card>

      {/* Note drawer */}
      {openNote && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-line bg-bg-mid shadow-[var(--shadow-lift)] flex flex-col">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
            <span className="font-display font-semibold text-cream truncate">{openNote.slug}</span>
            <button
              onClick={() => setOpenNote(null)}
              className="rounded-full border border-line px-3 py-1 font-mono text-[10px] text-cream-dim hover:text-cream"
            >
              ✕ close
            </button>
          </div>
          <pre className="flex-1 overflow-y-auto whitespace-pre-wrap px-5 py-4 font-mono text-xs leading-relaxed text-cream-soft">
            {openNote.content}
          </pre>
        </div>
      )}
    </div>
  );
}
