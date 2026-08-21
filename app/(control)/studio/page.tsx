"use client";

import React from "react";
import { Music, Clapperboard, Gamepad2, ImageIcon, Play } from "lucide-react";
import { PageHeader, Card, Textarea, GoldButton } from "@/components/ui";

const MODES = [
  {
    id: "music",
    icon: Music,
    title: "Music Studio",
    desc: "Prompt → original scored track for your videos, with an inline player.",
  },
  {
    id: "video",
    icon: Clapperboard,
    title: "Video Studio",
    desc: "Brief → script → gate → avatar + cloned voice → dopamine edit → judge 1–10 → loops until 8+.",
  },
  {
    id: "game",
    icon: Gamepad2,
    title: "Game Studio",
    desc: "One sentence → a single self-contained HTML game, playable right here.",
  },
  {
    id: "thumbnail",
    icon: ImageIcon,
    title: "Thumbnail Studio",
    desc: "Upload + say what to fix → higher-CTR variants and 10 title options.",
  },
];

const GALLERY = [
  { name: "kimi-promo.mp4", kind: "video", note: "judged 6 → 7 → 9" },
  { name: "hermes-promo.mp4", kind: "video", note: "judged 9/10 — purple theme" },
  { name: "agentos-promo.mp4", kind: "video", note: "judged 9/10 — gold theme" },
  { name: "neon-racer.html", kind: "game", note: "one-shot build" },
];

export default function StudioPage() {
  const [mode, setMode] = React.useState("video");
  const [brief, setBrief] = React.useState("");

  return (
    <div>
      <PageHeader
        numeral="VII."
        section="Self · Studio"
        title="Studio"
        subtitle="The OS doesn't just write — it makes things. Music, video, games, thumbnails: one prompt in, a finished asset out."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className="text-left">
            <Card
              hover
              className={`p-5 h-full ${mode === m.id ? "border-gold/60 shadow-[0_0_30px_rgba(212,165,116,0.12)]" : ""}`}
            >
              <m.icon size={22} className={mode === m.id ? "text-gold" : "text-cream-mute"} />
              <h3 className="font-display font-semibold text-cream text-lg mt-3 mb-1.5">{m.title}</h3>
              <p className="text-xs text-cream-dim leading-relaxed">{m.desc}</p>
            </Card>
          </button>
        ))}
      </div>

      <Card className="p-6 mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          {MODES.find((m) => m.id === mode)?.title} · Brief
        </div>
        <Textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
          placeholder={
            mode === "video"
              ? "Make a ~50s promo about my Agent OS — hook in the first 3 seconds, CTA at the end."
              : mode === "game"
                ? "A cyberpunk city I fly through, dodging neon towers."
                : mode === "music"
                  ? "A slow-building cinematic score for a product reveal."
                  : "Make the title pop and add contrast — it's a tutorial thumbnail."
          }
        />
        <div className="mt-4 flex justify-end">
          <GoldButton disabled={!brief.trim()}>
            <Play size={13} /> Run the crew
          </GoldButton>
        </div>
        {mode === "video" && (
          <div className="mt-6 grid grid-cols-5 gap-2">
            {["Brief", "Likeness", "The Cut", "Screening", "Ship ≥8/10"].map((s, i) => (
              <div
                key={s}
                className={`rounded-lg border px-2 py-2 text-center font-mono text-[10px] ${
                  i === 0
                    ? "border-gold/50 text-gold bg-gold/10"
                    : "border-line-soft text-cream-mute"
                }`}
              >
                {i + 1}. {s}
              </div>
            ))}
          </div>
        )}
      </Card>

      <h3 className="font-display font-semibold text-cream text-lg mb-3">What the crew shipped</h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {GALLERY.map((g) => (
          <Card key={g.name} hover className="p-4">
            <div className="flex h-24 items-center justify-center rounded-xl bg-bg-deep border border-line-soft mb-3 text-2xl text-gold">
              {g.kind === "video" ? "▶" : "🎮"}
            </div>
            <div className="font-mono text-xs text-cream truncate">{g.name}</div>
            <div className="font-mono text-[10px] text-cream-mute">{g.note}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
