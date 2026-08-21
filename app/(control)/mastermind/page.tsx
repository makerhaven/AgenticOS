"use client";

import React from "react";
import { Send } from "lucide-react";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { AGENTS } from "@/lib/agents";
import { uid } from "@/lib/client-utils";

interface RoomMessage {
  id: string;
  who: string; // "you" or agent id
  text: string;
  at: string;
}

const COMEBACKS: Record<string, string> = {
  claude: "The careful answer: do it in stages and measure each. I'd gate the risky part behind an approval.",
  glm: "Cheap and fast wins here. I can grind the volume side of this all day for pennies.",
  hermes: "I'll take the long-running part — hand it to Goal Mode and I'll report into the vault when it's done.",
  grok: "Hot take: ship the scrappy version today, iterate on the real feedback tomorrow.",
  fusion: "This one's expensive to be wrong about — convene the panel and let the judge write the final call.",
};

export default function MastermindPage() {
  const [messages, setMessages] = React.useState<RoomMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  const send = async () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setMessages((m) => [...m, { id: uid("r"), who: "you", text, at: new Date().toISOString() }]);

    // Tagged agent answers, otherwise three chime in.
    const tag = text.match(/@(\w+)/)?.[1]?.toLowerCase();
    const responders = tag && AGENTS.some((a) => a.id === tag)
      ? [tag]
      : ["claude", "glm", "hermes"];

    for (const [i, id] of responders.entries()) {
      const agent = AGENTS.find((a) => a.id === id);
      if (!agent) continue;
      setTimeout(() => setTyping((t) => [...t, id]), 400 + i * 900);
      setTimeout(
        () => {
          setTyping((t) => t.filter((x) => x !== id));
          setMessages((m) => [
            ...m,
            {
              id: uid("r"),
              who: id,
              text:
                COMEBACKS[id] ??
                `${agent.name} here — I've read the vault context on this. My angle: ${text.slice(0, 50)}…`,
              at: new Date().toISOString(),
            },
          ]);
        },
        1600 + i * 1400
      );
    }
  };

  const agentOf = (id: string) => AGENTS.find((a) => a.id === id);

  return (
    <div>
      <PageHeader
        numeral="V."
        section="Agent Orchestration · Mastermind"
        title="AI Agent Mastermind"
        subtitle="Every model at one table, each reading your vault. Ask one question — get the whole room. Tag with @, or let them pick."
      />

      <Card className="flex flex-col h-[600px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && (
            <EmptyState
              icon="❖"
              text="The room is seated — Claude, GLM, Hermes, Grok, Fusion and the rest, all reading the same brain. Ask anything."
            />
          )}
          {messages.map((m) => {
            const a = agentOf(m.who);
            const isYou = m.who === "you";
            return (
              <div key={m.id} className={`flex gap-3 ${isYou ? "flex-row-reverse" : ""}`}>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isYou
                      ? "bg-gold text-bg-deep"
                      : `bg-gradient-to-br ${a?.hue ?? "from-slate-400 to-slate-600"} text-bg-deep`
                  }`}
                >
                  {isYou ? "You" : a?.glyph}
                </span>
                <div className={`max-w-[75%] ${isYou ? "text-right" : ""}`}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute mb-1">
                    {isYou ? "You" : a?.name}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isYou
                        ? "bg-gold/15 border border-gold/30 text-cream"
                        : "bg-bg-elev border border-line-soft text-cream-soft"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          {typing.map((id) => {
            const a = agentOf(id);
            return (
              <div key={id} className="flex items-center gap-3 text-cream-mute">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${a?.hue} text-sm font-bold text-bg-deep`}
                >
                  {a?.glyph}
                </span>
                <span className="font-mono text-xs animate-pulse">{a?.name} is thinking…</span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-line-soft p-4 flex gap-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask the room… (@claude to tag one)"
            className="flex-1 rounded-xl border border-line-soft bg-bg-deep/60 px-4 py-2.5 text-sm text-cream placeholder:text-cream-mute focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          <button
            onClick={send}
            className="rounded-xl bg-gradient-to-b from-gold-soft to-gold-deep px-4 text-bg-deep transition-transform hover:scale-105"
          >
            <Send size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}
