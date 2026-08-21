"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Zap } from "lucide-react";
import { PageHeader, Card, Input } from "@/components/ui";

type KanbanColumn = "triage" | "todo" | "ready" | "running" | "blocked" | "done";

interface KanbanCard {
  id: string;
  board: string;
  title: string;
  assignee: string;
  column: KanbanColumn;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  question?: string;
}

const KANBAN_COLUMNS: { id: KanbanColumn; label: string; accent: string; text: string }[] = [
  { id: "triage", label: "TRIAGE", accent: "border-t-plum", text: "text-plum" },
  { id: "todo", label: "TODO", accent: "border-t-cream-dim", text: "text-cream-dim" },
  { id: "ready", label: "READY", accent: "border-t-cyan-400", text: "text-cyan-300" },
  { id: "running", label: "RUNNING", accent: "border-t-gold", text: "text-gold" },
  { id: "blocked", label: "BLOCKED", accent: "border-t-red-500", text: "text-red-400" },
  { id: "done", label: "DONE", accent: "border-t-emerald", text: "text-emerald" },
];

export default function KanbanPage() {
  return (
    <React.Suspense fallback={null}>
      <KanbanInner />
    </React.Suspense>
  );
}

function KanbanInner() {
  const params = useSearchParams();
  const board = params.get("board") ?? "default";
  const [cards, setCards] = React.useState<KanbanCard[]>([]);
  const [draft, setDraft] = React.useState("");
  const [assignee, setAssignee] = React.useState("you");
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dispatching, setDispatching] = React.useState(false);
  const [summaryFor, setSummaryFor] = React.useState<string | null>(null);
  const [summaryText, setSummaryText] = React.useState("");

  const load = React.useCallback(() => {
    fetch(`/control/api/kanban?board=${encodeURIComponent(board)}`)
      .then((r) => r.json())
      .then((d) => setCards(d.cards))
      .catch(() => {});
  }, [board]);

  React.useEffect(load, [load]);

  const add = async () => {
    if (!draft.trim()) return;
    await fetch("/control/api/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft, assignee, board, column: "triage" }),
    });
    setDraft("");
    load();
  };

  const move = async (id: string, column: KanbanColumn) => {
    if (column === "done") {
      setSummaryFor(id);
      return;
    }
    await fetch("/control/api/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, column }),
    });
    load();
  };

  const completeWithSummary = async () => {
    if (!summaryFor) return;
    await fetch("/control/api/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: summaryFor, column: "done", summary: summaryText }),
    });
    setSummaryFor(null);
    setSummaryText("");
    load();
  };

  const dispatch = async () => {
    setDispatching(true);
    await fetch("/control/api/kanban/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board }),
    });
    setDispatching(false);
    load();
  };

  const age = (iso: string) =>
    `${Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000))}d`;

  const profiles = new Set(cards.map((c) => c.assignee)).size;

  return (
    <div>
      <PageHeader
        numeral="XIII."
        section="Self · Kanban"
        title="Kanban"
        subtitle="Hermes Agent multi-agent board. Drop a prompt into triage, watch the orchestrator decompose + assign."
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="rounded-full border border-line bg-bg-card px-4 py-1.5 text-sm text-cream-dim focus:outline-none">
          <option>{board === "default" ? "Default (default)" : board}</option>
        </select>
        <Input placeholder="Search…" className="!w-44 !rounded-full !py-1.5" />
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="rounded-full border border-line bg-bg-card px-4 py-1.5 text-sm text-cream-dim focus:outline-none"
        >
          <option value="you">All assignees</option>
          <option value="julian">julian</option>
          <option value="hermes">hermes</option>
        </select>
        <button className="rounded-full border border-line px-4 py-1.5 text-sm text-cream-dim hover:text-cream">
          Show archived
        </button>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm text-cream-dim hover:text-cream"
        >
          <RefreshCw size={13} /> Refresh
        </button>
        <button
          onClick={dispatch}
          disabled={dispatching}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald text-emerald px-4 py-1.5 text-sm font-medium hover:bg-emerald/10 disabled:opacity-50"
        >
          <Zap size={13} /> {dispatching ? "Dispatching…" : "Dispatch now"}
        </button>
        <span className="ml-auto font-mono text-xs text-cream-mute">
          {cards.length} TASKS · {Math.max(profiles, 1)} PROFILES
        </span>
      </div>

      {/* New task row */}
      <Card className="mb-6 p-3 flex flex-wrap items-center gap-3">
        <Plus size={16} className="text-gold ml-2" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.metaKey && add()}
          placeholder="New task title… (⌘+Enter to create)"
          className="flex-1 min-w-[220px] bg-transparent px-2 py-2 text-sm text-cream placeholder:text-cream-mute focus:outline-none"
        />
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="rounded-lg border border-line bg-bg-card px-3 py-1.5 text-sm text-cream-dim focus:outline-none"
        >
          <option value="you">you</option>
          <option value="julian">julian</option>
          <option value="hermes">hermes</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#c4607e]" /> Triage
        </label>
        <button
          onClick={add}
          className="rounded-lg bg-gradient-to-b from-gold-soft to-gold-deep px-4 py-1.5 font-display text-sm font-bold text-bg-deep"
        >
          + Add
        </button>
      </Card>

      {/* Board */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {KANBAN_COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.column === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) move(dragId, col.id);
                setDragId(null);
              }}
              className={`min-h-[380px] rounded-2xl border border-line-soft border-t-2 ${col.accent} bg-bg-card/50 p-3`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.15em] ${col.text}`}>
                  ● {col.label}
                </span>
                <span className="font-mono text-[10px] text-cream-mute">{colCards.length}</span>
              </div>
              {colCards.length === 0 && (
                <div className="px-1 pt-2 text-sm italic text-cream-mute">empty</div>
              )}
              <div className="space-y-3">
                {colCards.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    className="cursor-grab rounded-xl border border-line-soft bg-bg-elev p-3.5 transition-colors hover:border-gold/40 active:cursor-grabbing"
                  >
                    <div className="text-sm text-cream leading-snug mb-3">{c.title}</div>
                    {c.summary && (
                      <div className="mb-2 text-xs text-cream-dim border-l-2 border-emerald pl-2">
                        {c.summary}
                      </div>
                    )}
                    <div className="flex items-center justify-between font-mono text-[10px] text-cream-mute">
                      <span>👤 {c.assignee}</span>
                      <span>⏱ {age(c.createdAt)}</span>
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-cream-mute/60">{c.id}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Done-summary modal */}
      {summaryFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/70 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-display font-semibold text-cream text-lg mb-2">
              What did the agent do?
            </h3>
            <p className="text-sm text-cream-dim mb-4">
              The summary is written back to the vault journal — that&apos;s the loop closing.
            </p>
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              rows={3}
              placeholder="e.g. Drafted 5 articles, deployed to all sites, submitted for indexing."
              className="w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 py-3 text-sm text-cream placeholder:text-cream-mute focus:outline-none focus:ring-2 focus:ring-gold/40 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSummaryFor(null)}
                className="rounded-full border border-line px-4 py-2 text-sm text-cream-dim"
              >
                Cancel
              </button>
              <button
                onClick={completeWithSummary}
                className="rounded-full bg-gradient-to-b from-gold-soft to-gold-deep px-5 py-2 font-display text-sm font-bold text-bg-deep"
              >
                Move to Done ✓
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
