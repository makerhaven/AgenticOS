"use client";

import React from "react";
import { Crosshair, RefreshCw, Square, Play } from "lucide-react";
import { PageHeader, Card, Input, Textarea, GoldButton, EmptyState } from "@/components/ui";

type GoalStatus = "planning" | "working" | "checking" | "done" | "failed";

interface Goal {
  id: string;
  title: string;
  prompt: string;
  agent: string;
  status: GoalStatus;
  turns: number;
  maxTurns: number;
  createdAt: string;
  updatedAt: string;
  log: string[];
}

const STATUS_STYLE: Record<Goal["status"], { label: string; cls: string }> = {
  planning: { label: "Planning", cls: "text-gold border-gold/40 bg-gold/10" },
  working: { label: "Working", cls: "text-cyan-300 border-cyan-400/40 bg-cyan-400/10" },
  checking: { label: "Checking", cls: "text-plum border-plum/40 bg-plum/10" },
  done: { label: "Done ✓", cls: "text-emerald border-emerald/40 bg-emerald/10" },
  failed: { label: "Stopped", cls: "text-red-400 border-red-400/40 bg-red-400/10" },
};

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [title, setTitle] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [launching, setLaunching] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/control/api/goals")
      .then((r) => r.json())
      .then((d) => setGoals(d.goals))
      .catch(() => {});
  }, []);

  React.useEffect(load, [load]);

  const launch = async () => {
    if (!prompt.trim()) return;
    setLaunching(true);
    await fetch("/control/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, prompt }),
    });
    setTitle("");
    setPrompt("");
    setLaunching(false);
    load();
  };

  const act = async (id: string, action: "tick" | "stop") => {
    await fetch("/control/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  };

  const sel = goals.find((g) => g.id === selected);

  return (
    <div>
      <PageHeader
        numeral="IX."
        section="Self · Goals"
        title="Goal Mode"
        subtitle="One target, typed once. The agent plans, works, checks its own progress — for hours, alone."
      />

      {/* Banner */}
      <Card className="mb-8 p-6 border-gold/30 bg-gradient-to-r from-bg-card via-bg-elev to-bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-400/30">
              <Crosshair size={20} className="text-sky-300" />
            </span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300 mb-1">
                Hermes · Goal Mode
              </div>
              <div className="font-display font-bold text-cream text-2xl tracking-tight mb-1">
                Set the target. Walk away.
              </div>
              <p className="text-sm text-cream-dim max-w-[58ch]">
                Hand Hermes a long-horizon goal. It runs <code className="font-mono text-gold text-xs">hermes chat --yolo --max-turns 50</code> in
                its own scratch dir. Close your laptop, go to sleep, come back to finished work.
              </p>
            </div>
          </div>
          <div className="font-mono text-xs text-cream-mute">{goals.length} TOTAL</div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* New goal */}
          <Card className="p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
              New Goal
            </div>
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Goal title (optional — auto-derived from prompt)"
              />
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="What should Hermes do? Be specific. Example: Generate 5 unique blog posts about AI automation for ecommerce, save to ./posts/ as .md with frontmatter, ready to deploy."
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-cream-mute">⌘+Enter to launch</span>
                <GoldButton onClick={launch} disabled={launching || !prompt.trim()}>
                  ➤ {launching ? "Launching…" : "Launch goal"}
                </GoldButton>
              </div>
            </div>
          </Card>

          {/* Goals list */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                Goals · {goals.length}
              </span>
              <button
                onClick={load}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream-mute hover:text-cream"
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
            <div className="space-y-3">
              {goals.length === 0 && (
                <p className="text-sm text-cream-mute">No goals yet. Set one above and walk away.</p>
              )}
              {goals.map((g) => {
                const s = STATUS_STYLE[g.status];
                const pct = Math.round((g.turns / g.maxTurns) * 100);
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      selected === g.id
                        ? "border-gold/50 bg-bg-elev"
                        : "border-line-soft bg-bg-deep/40 hover:border-gold/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-medium text-cream text-sm truncate pr-3">
                        {g.title}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-deep overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-gold-deep to-gold transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="font-mono text-[10px] text-cream-mute">
                      {g.turns} / {g.maxTurns} turns
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Detail */}
        <Card className="p-6 min-h-[420px]">
          {!sel ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState icon="◎" text="Pick a goal to watch live" />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-cream text-lg">{sel.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(sel.id, "tick")}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald px-3 py-1 font-mono text-[10px] text-emerald hover:bg-emerald/10"
                  >
                    <Play size={10} /> Tick
                  </button>
                  <button
                    onClick={() => act(sel.id, "stop")}
                    className="inline-flex items-center gap-1 rounded-full border border-red-400/50 px-3 py-1 font-mono text-[10px] text-red-400 hover:bg-red-400/10"
                  >
                    <Square size={10} /> Stop
                  </button>
                </div>
              </div>
              <p className="text-sm text-cream-dim mb-4 whitespace-pre-wrap">{sel.prompt}</p>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-2">
                Run log
              </div>
              <div className="rounded-xl border border-line-soft bg-bg-deep/60 p-4 font-mono text-xs text-cream-soft space-y-1.5 max-h-72 overflow-y-auto">
                {sel.log.map((l, i) => (
                  <div key={i}>▸ {l}</div>
                ))}
              </div>
              <div className="mt-3 font-mono text-[10px] text-cream-mute">
                Scratch dir: workspaces/{sel.agent}/goals/{sel.id}/
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
