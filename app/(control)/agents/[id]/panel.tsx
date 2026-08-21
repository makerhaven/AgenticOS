"use client";

import React from "react";
import { Send, Wrench, FolderOpen, Shield, Radio, Crosshair } from "lucide-react";
import { PageHeader, Card, Pill, StatusDot, EmptyState } from "@/components/ui";
import { uid } from "@/lib/client-utils";
import type { AgentDef } from "@/lib/agents";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  tool?: { name: string; args: string; durationMs: number };
  createdAt: string;
}

interface ChatSession {
  id: string;
  agentId: string;
  title: string;
}

function ChatTab({ agent }: { agent: AgentDef }) {
  const [session, setSession] = React.useState<ChatSession | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || streaming) return;
    const text = draft.trim();
    setDraft("");
    setStreaming(true);
    setMessages((m) => [
      ...m,
      { id: uid("m"), role: "user", text, createdAt: new Date().toISOString() },
    ]);

    const agentMsgId = uid("m");
    setMessages((m) => [
      ...m,
      { id: agentMsgId, role: "agent", text: "", createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/control/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, sessionId: session?.id, message: text }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "session") {
              setSession((s) => s ?? ({ id: ev.sessionId } as ChatSession));
            } else if (ev.type === "token") {
              setMessages((m) =>
                m.map((msg) => (msg.id === agentMsgId ? { ...msg, text: msg.text + ev.text } : msg))
              );
            } else if (ev.type === "tool") {
              setMessages((m) =>
                m.map((msg) => (msg.id === agentMsgId ? { ...msg, tool: ev.tool } : msg))
              );
            }
          }
        }
      }
    } finally {
      setStreaming(false);
    }
  };

  const tokens = Math.round(messages.reduce((s, m) => s + m.text.length, 0) / 4);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <Card className="flex flex-col h-[560px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <EmptyState
              icon="✦"
              text={`Say something to ${agent.name}. It reads the vault before answering.`}
            />
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gold/15 border border-gold/30 text-cream"
                    : "bg-bg-elev border border-line-soft text-cream-soft"
                }`}
              >
                {m.tool && (
                  <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-bg-deep/70 border border-line-soft px-2.5 py-1 font-mono text-[10px] text-gold">
                    <Wrench size={10} />
                    {m.tool.name} · {m.tool.args} · {m.tool.durationMs}ms
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {m.text || (m.role === "agent" && streaming ? "…" : "")}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line-soft p-4 flex gap-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message ${agent.name}…`}
            className="flex-1 rounded-xl border border-line-soft bg-bg-deep/60 px-4 py-2.5 text-sm text-cream placeholder:text-cream-mute focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          <button
            onClick={send}
            disabled={streaming}
            className="rounded-xl bg-gradient-to-b from-gold-soft to-gold-deep px-4 text-bg-deep transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-2">
            Context
          </div>
          <div className="font-mono text-sm text-cream mb-2">
            {tokens.toLocaleString()} / 200k tokens
          </div>
          <div className="h-1.5 rounded-full bg-bg-deep overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald to-gold transition-all"
              style={{ width: `${Math.min(100, (tokens / 200000) * 100)}%` }}
            />
          </div>
          <div className="mt-2 font-mono text-[10px] text-cream-mute">
            Auto-compacts at 70% — summaries, not transcripts.
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-2">
            Model
          </div>
          <div className="font-mono text-sm text-cream">
            {agent.id === "hermes" ? "kimi-k3" : agent.id === "claude" ? "claude-code" : "mock-free"}
          </div>
          <div className="font-mono text-[10px] text-cream-mute mt-1">{agent.provider}</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-2">
            Memory scope
          </div>
          <div className="font-mono text-[11px] text-cream-dim leading-relaxed">
            reads: Business Context, Goals, Memory
            <br />
            writes: Journal, Memory/{agent.id}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WorkspaceTab({ agent }: { agent: AgentDef }) {
  const files = [
    { name: "latest-build.html", kind: "page", age: "2h" },
    { name: "notes.md", kind: "doc", age: "5h" },
    { name: "draft-article.md", kind: "doc", age: "1d" },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-3 flex items-center gap-2">
          <FolderOpen size={12} /> workspaces/{agent.id}
        </div>
        <div className="space-y-1">
          {files.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cream-dim hover:bg-bg-elev hover:text-cream cursor-pointer"
            >
              <span className="font-mono text-xs truncate">{f.name}</span>
              <span className="font-mono text-[10px] text-cream-mute">{f.age}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6 min-h-[400px] flex items-center justify-center">
        <EmptyState icon="▣" text="Every output this agent makes lands here — clickable, saved, replayable." />
      </Card>
    </div>
  );
}

function ControlRoomTab({ agent }: { agent: AgentDef }) {
  const steps = [
    { name: "vault.read", detail: "Pulled Business Context (3 notes)", ms: 142, tokens: 812, ok: true },
    { name: "plan", detail: "Decomposed into 4 steps", ms: 2103, tokens: 4021, ok: true },
    { name: "web.search", detail: "3 queries, 14 results", ms: 1840, tokens: 6290, ok: true },
    { name: "file.write", detail: "draft-article.md (2.1 KB)", ms: 320, tokens: 1180, ok: false },
    { name: "journal.append", detail: "Skipped — previous step failed", ms: 0, tokens: 0, ok: true },
  ];
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald">
              Read-only glass box
            </span>
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border border-line px-3 py-1 font-mono text-[10px] text-cream-dim hover:text-cream">
              Export .md
            </button>
            <button className="rounded-full border border-line px-3 py-1 font-mono text-[10px] text-cream-dim hover:text-cream">
              Export .json
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                  s.ok
                    ? "border-line-soft bg-bg-deep/40 hover:border-gold/30"
                    : "border-red-500/50 bg-red-500/10 shadow-[0_0_24px_rgba(239,68,68,0.15)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-cream-mute">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`font-mono text-sm ${s.ok ? "text-cream" : "text-red-300"}`}>
                      {s.name}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-cream-mute">
                    {s.ms}ms · {s.tokens} tok
                  </div>
                </div>
                <div className="mt-1 text-xs text-cream-dim pl-8">{s.detail}</div>
              </button>
              {open === i && (
                <div className="mt-2 ml-8 rounded-xl border border-line-soft bg-bg-deep/60 p-4 space-y-2">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream-mute">Input</div>
                    <pre className="font-mono text-xs text-cream-soft whitespace-pre-wrap">{s.detail}</pre>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream-mute">Output</div>
                    <pre className="font-mono text-xs text-cream-soft whitespace-pre-wrap">
                      {s.ok ? "ok" : "Error: ENOENT — workspace path missing. Fix: create workspaces/ first."}
                    </pre>
                  </div>
                  <div className="font-mono text-[10px] text-cream-mute">
                    Timing {s.ms}ms · Tokens {s.tokens} · Secrets redacted
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-3">
            Skills
          </div>
          {["seo-article", "weekly-report", "competitor-scan"].map((s, i) => (
            <div key={s} className="flex items-center justify-between py-1.5">
              <span className="font-mono text-xs text-cream">{s}</span>
              <span
                className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full ${
                  i < 2 ? "bg-emerald/10 text-emerald" : "bg-gold/10 text-gold"
                }`}
              >
                {i < 2 ? "in use" : "stale"}
              </span>
            </div>
          ))}
        </Card>
        <Card className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-3">
            Model switches
          </div>
          <div className="space-y-2 font-mono text-xs text-cream-dim">
            <div>00:00 — started on <span className="text-emerald">mock-free</span></div>
            <div>00:31 — escalated to <span className="text-gold">claude-code</span> (judge step)</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ManageTab({ agent }: { agent: AgentDef }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-display font-semibold text-cream text-lg mb-4">Model profiles</h3>
        <div className="space-y-2">
          {[
            { name: "mock-free", tier: 0 },
            { name: "glm-5.2", tier: 1 },
            { name: "claude-code", tier: 2 },
          ].map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between rounded-xl border border-line-soft bg-bg-deep/40 px-4 py-3"
            >
              <span className="font-mono text-sm text-cream">{m.name}</span>
              <span className="font-mono text-[10px] text-gold">tier {m.tier}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-cream-mute">
          The router sends each job to the cheapest profile that can do it well. Two-click add: name, endpoint, env key ref.
        </p>
      </Card>
      <Card className="p-6">
        <h3 className="font-display font-semibold text-cream text-lg mb-4">Surfaces & schedule</h3>
        <div className="space-y-3">
          {agent.tabs.map((t) => (
            <label key={t} className="flex items-center justify-between text-sm text-cream-dim cursor-pointer">
              {t}
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#5ab896]" />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlaceholderTab({ name, agent }: { name: string; agent: AgentDef }) {
  const copy: Record<string, string> = {
    Apollo: "Voice line. Say “Hey Hermes” — the command lands in chat and the answer comes back spoken.",
    Oracle: "Watches your competitors on a timer and reports back — signals ranked, source and your angle already written.",
    Muse: "Scans what’s burning hottest in your niche every morning at 06:20 and hands you content ideas.",
    Astros: "Scheduled research tab — set once in Manage, runs forever.",
    Studio: "Images, voice, live talk and video renders — outputs land in the workspace.",
    Sessions: "Every conversation this agent has ever held, persistent across restarts.",
    Outreach: "Drafted outreach queued for your approval before anything sends.",
    Mixture: "Blend this agent’s voice with others for a house style.",
    MCPs: "Model Context Protocol servers wired to this agent — tools, memory, external services.",
    "Goal Mode": "Set the target. Walk away. (Also available at /control/goals.)",
  };
  return (
    <Card className="p-10">
      <EmptyState icon="◈" text={copy[name] ?? `${name} — part of the ${agent.name} control surface.`} />
    </Card>
  );
}

export function AgentPanel({ agent }: { agent: AgentDef }) {
  const [tab, setTab] = React.useState("Chat");

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.hue} text-lg font-bold text-bg-deep`}
        >
          {agent.glyph}
        </span>
        <div className="flex items-center gap-2">
          <StatusDot status="online" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald">Online</span>
        </div>
      </div>
      <PageHeader
        numeral="IV."
        section={`Agent · ${agent.name}`}
        title={agent.name}
        subtitle={agent.role}
      />

      <div className="flex flex-wrap gap-2 mb-8">
        {agent.tabs.map((t) => (
          <Pill key={t} active={tab === t} tone={t === "Goal Mode" ? "emerald" : "default"} onClick={() => setTab(t)}>
            {t === "Goal Mode" && <Crosshair size={12} />}
            {t === "Apollo" && <Radio size={12} />}
            {t}
          </Pill>
        ))}
      </div>

      {tab === "Chat" && <ChatTab agent={agent} />}
      {tab === "Workspace" && <WorkspaceTab agent={agent} />}
      {tab === "Control Room" && <ControlRoomTab agent={agent} />}
      {tab === "Manage" && <ManageTab agent={agent} />}
      {!["Chat", "Workspace", "Control Room", "Manage"].includes(tab) && (
        <PlaceholderTab name={tab} agent={agent} />
      )}
    </div>
  );
}
