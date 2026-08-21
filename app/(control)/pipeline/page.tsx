"use client";

import React from "react";
import { Play, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";

interface Stage {
  name: string;
  desc: string;
  status: "pending" | "running" | "done" | "gate";
}

const TEMPLATE: Stage[] = [
  { name: "Triage", desc: "Inbox sorted, work planned by agents", status: "pending" },
  { name: "Approve", desc: "You approve the plan once", status: "pending" },
  { name: "Build", desc: "PM agent + subagents build the thing", status: "pending" },
  { name: "Ship", desc: "Output lands in the workspace, vault updated", status: "pending" },
];

export default function PipelinePage() {
  const [stages, setStages] = React.useState<Stage[]>(TEMPLATE);
  const [running, setRunning] = React.useState(false);

  const run = async () => {
    setRunning(true);
    const seq: Stage["status"][] = ["running", "done"];
    for (let i = 0; i < stages.length; i++) {
      setStages((s) => s.map((st, j) => (j === i ? { ...st, status: "running" } : st)));
      if (i === 1) {
        // Approval gate — pause until user clicks.
        setStages((s) => s.map((st, j) => (j === i ? { ...st, status: "gate" } : st)));
        setRunning(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 1400));
      setStages((s) => s.map((st, j) => (j === i ? { ...st, status: seq[1] } : st)));
    }
    setRunning(false);
  };

  const approve = async () => {
    setRunning(true);
    setStages((s) => s.map((st, j) => (j === 1 ? { ...st, status: "done" } : st)));
    for (let i = 2; i < stages.length; i++) {
      setStages((s) => s.map((st, j) => (j === i ? { ...st, status: "running" } : st)));
      await new Promise((r) => setTimeout(r, 1400));
      setStages((s) => s.map((st, j) => (j === i ? { ...st, status: "done" } : st)));
    }
    setRunning(false);
  };

  return (
    <div>
      <PageHeader
        numeral="III."
        section="Agent Orchestration · Pipeline"
        title="Pipeline"
        subtitle="An idea in, a shipped project out. Agents pass the work along the line — one approval gate before it ships."
      />

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-cream text-lg">Idea → shipped</h3>
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-soft to-gold-deep px-5 py-2 font-display text-sm font-bold text-bg-deep disabled:opacity-50"
          >
            <Play size={13} /> {running ? "Running…" : "Run pipeline"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {stages.map((s, i) => (
            <div
              key={s.name}
              className={`rounded-xl border p-4 transition-colors ${
                s.status === "done"
                  ? "border-emerald/50 bg-emerald/5"
                  : s.status === "running"
                    ? "border-gold/50 bg-gold/5"
                    : s.status === "gate"
                      ? "border-plum/60 bg-plum/10"
                      : "border-line-soft bg-bg-deep/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {s.status === "done" ? (
                  <CheckCircle2 size={15} className="text-emerald" />
                ) : s.status === "running" ? (
                  <Loader2 size={15} className="text-gold animate-spin" />
                ) : s.status === "gate" ? (
                  <ShieldCheck size={15} className="text-plum" />
                ) : (
                  <Circle size={15} className="text-cream-mute" />
                )}
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-cream-mute">
                  Stage {i + 1}
                </span>
              </div>
              <div className="font-display font-medium text-cream text-sm mb-1">{s.name}</div>
              <p className="text-xs text-cream-dim">{s.desc}</p>
              {s.status === "gate" && (
                <button
                  onClick={approve}
                  className="mt-3 w-full rounded-lg bg-gradient-to-b from-gold-soft to-gold-deep px-3 py-1.5 font-display text-xs font-bold text-bg-deep"
                >
                  Approve once →
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <p className="font-mono text-[10px] text-cream-mute text-center uppercase tracking-[0.2em]">
        Drop a prompt into Kanban triage — the orchestrator decomposes, this line ships it.
      </p>
    </div>
  );
}
