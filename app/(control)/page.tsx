"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Boxes,
  Feather,
  HeartPulse,
  Zap,
  Cpu,
  History,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader, Card, StatusDot, Divider, Input, GoldButton, Eyebrow } from "@/components/ui";
import { AGENTS } from "@/lib/agents";

interface AgentStatus {
  id: string;
  online: boolean;
  label: string;
  sub: string;
  latencyMs?: number;
}

interface TodayItem {
  id: string;
  text: string;
  heading: boolean;
  done: boolean;
  createdAt: string;
}

interface StatusPayload {
  agents: AgentStatus[];
  vault: { ok: boolean; noteCount: number };
  heartbeat: { ticks: number; intervalS: number };
  latencyP50: number;
  todayTokens: number;
}

interface ActivityItem {
  id: string;
  kind: string;
  text: string;
  at: string;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  claude: Sparkles,
  openclaw: Boxes,
  hermes: Feather,
  heartbeat: HeartPulse,
  latency: Zap,
  freeclaude: Cpu,
};

function StatusCard({
  icon: Icon,
  label,
  value,
  sub,
  status,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  status: "online" | "offline" | "idle";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold-deep">
          <Icon size={13} className="text-gold" />
          {label}
        </span>
        <StatusDot status={status} />
      </div>
      <div className="font-display font-semibold text-cream text-2xl tracking-tight mb-1">
        {value}
      </div>
      <div className="font-mono text-xs text-cream-mute truncate">{sub}</div>
    </Card>
  );
}

function AgentControlCard({ id }: { id: string }) {
  const agent = AGENTS.find((a) => a.id === id);
  const [status, setStatus] = React.useState<AgentStatus | null>(null);

  React.useEffect(() => {
    fetch("/control/api/agents/status")
      .then((r) => r.json())
      .then((d: StatusPayload) => setStatus(d.agents.find((s) => s.id === id) ?? null))
      .catch(() => {});
  }, [id]);

  if (!agent) return null;
  const online = status?.online ?? true;

  return (
    <Link href={`/control/agents/${agent.id}`}>
      <Card hover className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-5">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.hue} text-lg font-bold text-bg-deep shadow-lg`}
          >
            {agent.glyph}
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5 ${
              online ? "text-emerald" : "text-plum"
            }`}
          >
            <StatusDot status={online ? "online" : "offline"} />
            {online ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-display font-semibold text-cream text-2xl tracking-tight">
            {agent.name}
          </h3>
          <ArrowUpRight size={16} className="text-cream-mute" />
        </div>
        <p className="text-cream-dim text-sm leading-relaxed mb-6 flex-1">{agent.role}</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg bg-bg-deep/60 border border-line-soft px-3 py-2">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream-mute mb-0.5">
              {agent.id === "openclaw" ? "Agents" : agent.id === "hermes" ? "Model" : "Version"}
            </div>
            <div className="font-mono text-sm text-cream truncate">
              {agent.id === "openclaw" ? "0" : agent.id === "hermes" ? "kimi-k3" : "2.1.220"}
            </div>
          </div>
          <div className="rounded-lg bg-bg-deep/60 border border-line-soft px-3 py-2">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream-mute mb-0.5">
              {agent.id === "openclaw" ? "Sessions" : agent.id === "hermes" ? "Provider" : "Latency"}
            </div>
            <div className="font-mono text-sm text-cream truncate">
              {agent.id === "openclaw" ? "0" : agent.id === "hermes" ? "OpenRouter" : `${status?.latencyMs ?? 59}ms`}
            </div>
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-deep">
          Open Control Room →
        </div>
      </Card>
    </Link>
  );
}

function TodayPanel() {
  const [items, setItems] = React.useState<TodayItem[]>([]);
  const [draft, setDraft] = React.useState("");

  const load = React.useCallback(() => {
    fetch("/control/api/today")
      .then((r) => r.json())
      .then((d) => setItems(d.items))
      .catch(() => {});
  }, []);

  React.useEffect(load, [load]);

  const add = async () => {
    if (!draft.trim()) return;
    await fetch("/control/api/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: draft }),
    });
    setDraft("");
    load();
  };

  const toggle = async (id: string, done: boolean) => {
    await fetch("/control/api/today", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done }),
    });
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-cream text-lg">Today&apos;s list</h3>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[10px] text-cream-dim hover:text-cream hover:border-gold/40 transition-colors">
          <History size={11} /> History
        </button>
      </div>
      <div className="mb-5 space-y-1">
        {items.length === 0 && (
          <p className="text-cream-mute text-sm py-2">
            Nothing yet — add the first thing to knock out today.
          </p>
        )}
        {items.map((i) =>
          i.heading ? (
            <div key={i.id} className="font-display font-semibold text-gold text-sm pt-3">
              {i.text}
            </div>
          ) : (
            <label
              key={i.id}
              className="flex items-center gap-3 py-1.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={i.done}
                onChange={(e) => toggle(i.id, e.target.checked)}
                className="h-4 w-4 rounded border-line bg-bg-deep accent-[#d4a574]"
              />
              <span
                className={`text-sm ${
                  i.done ? "line-through text-cream-mute" : "text-cream-soft group-hover:text-cream"
                }`}
              >
                {i.text}
              </span>
            </label>
          )
        )}
      </div>
      <div className="flex gap-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task… start with # for a heading (Enter)"
        />
        <GoldButton onClick={add}>
          <Plus size={14} /> Add
        </GoldButton>
      </div>
    </Card>
  );
}

function ActivityStream() {
  const [events, setEvents] = React.useState<ActivityItem[]>([]);

  React.useEffect(() => {
    const es = new EventSource("/control/api/activity");
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data) as ActivityItem;
        setEvents((prev) => {
          if (prev.some((x) => x.id === e.id)) return prev;
          return [e, ...prev].slice(0, 60);
        });
      } catch {
        /* keepalive */
      }
    };
    return () => es.close();
  }, []);

  const rel = (iso: string) => {
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <Card className="p-6">
      <h3 className="font-display font-semibold text-cream text-lg mb-4">Live activity</h3>
      {events.length === 0 ? (
        <p className="text-cream-mute text-sm">
          Quiet for now. Chat with an agent, move a kanban card, launch a goal — every signal lands here.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-3 text-sm">
              <span
                className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                  e.kind === "goal"
                    ? "bg-gold"
                    : e.kind === "kanban"
                      ? "bg-cyan-400"
                      : e.kind === "memory"
                        ? "bg-plum"
                        : e.kind === "chat"
                          ? "bg-emerald"
                          : "bg-cream-mute"
                }`}
              />
              <span className="flex-1 text-cream-dim leading-snug">{e.text}</span>
              <span className="font-mono text-[10px] text-cream-mute whitespace-nowrap">{rel(e.at)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function MissionControl() {
  const [status, setStatus] = React.useState<StatusPayload | null>(null);

  React.useEffect(() => {
    const load = () =>
      fetch("/control/api/agents/status")
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => {});
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const byId = (id: string) => status?.agents.find((a) => a.id === id);
  const featured = ["claude", "openclaw", "hermes"];

  return (
    <div>
      <PageHeader
        numeral="I."
        section="Mission Control"
        title="Mission Control"
        subtitle="Status of every agent, every memory, every signal."
      />

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <StatusCard
          icon={STATUS_ICONS.claude}
          label="Claude"
          value={byId("claude")?.label ?? "Online"}
          sub={byId("claude")?.sub ?? "2.1.220 · 59ms"}
          status={byId("claude")?.online === false ? "offline" : "online"}
        />
        <StatusCard
          icon={STATUS_ICONS.openclaw}
          label="OpenClaw"
          value={byId("openclaw")?.label ?? "…"}
          sub={byId("openclaw")?.sub ?? "0 agents · 0 sessions"}
          status={byId("openclaw")?.online ? "online" : "offline"}
        />
        <StatusCard
          icon={STATUS_ICONS.hermes}
          label="Hermes"
          value={byId("hermes")?.label ?? "Online"}
          sub={byId("hermes")?.sub ?? "kimi-k3 · OpenRouter"}
          status={byId("hermes")?.online === false ? "offline" : "online"}
        />
        <StatusCard
          icon={STATUS_ICONS.heartbeat}
          label="Heartbeat"
          value="1"
          sub={`poll ticks · ${status?.heartbeat.intervalS ?? 4}s`}
          status="idle"
        />
        <StatusCard
          icon={STATUS_ICONS.latency}
          label="Latency"
          value={`${status?.latencyP50 ?? 59} ms`}
          sub="combined p50"
          status="online"
        />
        <StatusCard
          icon={STATUS_ICONS.freeclaude}
          label="Free Claude"
          value={byId("freeclaude")?.label ?? "Live"}
          sub={byId("freeclaude")?.sub ?? "gemini-3.6-flash · free"}
          status={byId("freeclaude")?.online === false ? "offline" : "online"}
        />
      </div>

      <Divider />

      <Eyebrow>II. — Agents · click to open control room</Eyebrow>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-4">
        {featured.map((id) => (
          <AgentControlCard key={id} id={id} />
        ))}
      </div>

      <Divider />

      <Eyebrow>I.b — Today · tick it off</Eyebrow>
      <div className="grid gap-6 lg:grid-cols-2 mt-4">
        <TodayPanel />
        <ActivityStream />
      </div>

      <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute text-center">
        {status ? `${status.vault.noteCount} vault notes · ${status.todayTokens.toLocaleString()} tokens today` : ""}
      </div>
    </div>
  );
}
