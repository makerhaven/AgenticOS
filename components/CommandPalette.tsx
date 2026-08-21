"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AGENTS } from "@/lib/agents";

interface Item {
  id: string;
  label: string;
  group: string;
  href: string;
  keywords: string;
}

const STATIC_ITEMS: Item[] = [
  { id: "mc", label: "Mission Control", group: "Pages", href: "/control", keywords: "home status dashboard" },
  { id: "kanban", label: "Agent Kanban", group: "Pages", href: "/control/kanban", keywords: "board tasks tickets triage" },
  { id: "goals", label: "Goal Mode", group: "Pages", href: "/control/goals", keywords: "target launch long horizon" },
  { id: "memory", label: "Memory Galaxy", group: "Pages", href: "/control/memory", keywords: "vault obsidian graph stars notes" },
  { id: "seo", label: "SEO Content Pipeline", group: "Pages", href: "/control/seo", keywords: "keyword articles deploy netlify" },
  { id: "studio", label: "Studio", group: "Pages", href: "/control/studio", keywords: "music video game thumbnail" },
  { id: "mastermind", label: "AI Agent Mastermind", group: "Pages", href: "/control/mastermind", keywords: "group chat models debate" },
  { id: "pipeline", label: "Pipeline", group: "Pages", href: "/control/pipeline", keywords: "workflow stages ship" },
  { id: "notebook", label: "Notebook", group: "Pages", href: "/control/notebook", keywords: "research sources audio overview" },
  { id: "journal", label: "Journal", group: "Pages", href: "/control/journal", keywords: "daily log build journal" },
  { id: "paperclip", label: "Paperclip", group: "Pages", href: "/control/paperclip", keywords: "inbox attachments files" },
  { id: "settings", label: "Settings", group: "Pages", href: "/control/settings", keywords: "models router keys vault scheduler" },
  { id: "video", label: "Video board", group: "Pages", href: "/control/kanban?board=video-studio", keywords: "screening room crew edit judge" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [index, setIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const items: Item[] = React.useMemo(
    () => [
      ...STATIC_ITEMS,
      ...AGENTS.map((a) => ({
        id: `agent-${a.id}`,
        label: a.name,
        group: "Agents",
        href: `/control/agents/${a.id}`,
        keywords: `${a.id} ${a.provider} ${a.role}`,
      })),
    ],
    []
  );

  const results = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.keywords.toLowerCase().includes(q)
    );
  }, [items, query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  React.useEffect(() => setIndex(0), [query]);

  if (!open) return null;

  const go = (item: Item) => {
    onClose();
    router.push(item.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && results[index]) go(results[index]);
  };

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg-deep/70 backdrop-blur-sm pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-line bg-bg-card shadow-[var(--shadow-lift)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="Jump to a page, an agent, a surface…"
          className="w-full bg-transparent px-5 py-4 text-cream text-sm focus:outline-none border-b border-line-soft placeholder:text-cream-mute"
        />
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <div className="px-5 py-8 text-center text-cream-mute text-sm">Nothing matches.</div>
          )}
          {results.map((item, i) => {
            const header =
              item.group !== lastGroup ? (
                <div
                  key={`g-${item.group}`}
                  className="px-5 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-cream-mute"
                >
                  {item.group}
                </div>
              ) : null;
            lastGroup = item.group;
            return (
              <React.Fragment key={item.id}>
                {header}
                <button
                  onClick={() => go(item)}
                  onMouseEnter={() => setIndex(i)}
                  className={`w-full text-left px-5 py-2.5 text-sm flex items-center justify-between ${
                    i === index ? "bg-bg-elev text-cream" : "text-cream-dim"
                  }`}
                >
                  {item.label}
                  {i === index && <span className="font-mono text-[10px] text-gold">↵</span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
