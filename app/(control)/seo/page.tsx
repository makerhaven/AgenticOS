"use client";

import React from "react";
import {
  Search,
  Globe,
  Rocket,
  Sparkles,
  History,
  FileText,
  BookOpen,
  Package,
  TrendingUp,
} from "lucide-react";
import { PageHeader, Card, Pill, Input, GoldButton } from "@/components/ui";

const SEO_TABS = [
  { id: "research", label: "Research", icon: Search },
  { id: "parasite", label: "Parasite SEO", icon: Globe },
  { id: "openseo", label: "OpenSEO", icon: TrendingUp },
  { id: "office", label: "SEO Office", icon: BookOpen },
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "deploy", label: "Deploy", icon: Rocket },
  { id: "history", label: "History", icon: History },
  { id: "transcripts", label: "Transcripts", icon: FileText },
  { id: "skill", label: "Skill", icon: BookOpen },
];

const TRANSCRIPTS = [
  { name: "buzz-slack-alternative", size: "13.0KB" },
  { name: "x-mcp-server", size: "9.1KB" },
  { name: "hermes-desktop-app", size: "18.8KB" },
  { name: "agentic-os-mission-control", size: "12.8KB" },
  { name: "hermes-agent-use-cases", size: "9.3KB" },
  { name: "ai-money-lab-shared", size: "3.9KB" },
  { name: "ai-agent-community-platform", size: "2.9KB" },
  { name: "openclaw-ai-agent-community", size: "2.8KB" },
  { name: "aipb-community-shared", size: "6.8KB" },
  { name: "telegram-ai-agent", size: "2.5KB" },
];

function GeneratePanel() {
  const [keyword, setKeyword] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [autoDeploy, setAutoDeploy] = React.useState(true);
  const [running, setRunning] = React.useState(false);

  const generate = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 1800));
    setRunning(false);
  };

  return (
    <Card className="p-6">
      <h3 className="font-display font-semibold text-cream text-xl mb-5 flex items-center gap-2">
        <Sparkles size={18} className="text-emerald" />
        Generate 5 unique SEO articles for all 5 sites
      </h3>

      <div className="grid gap-4 md:grid-cols-2 mb-5">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute block mb-1.5">
            Target Keyword
          </label>
          <Input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
            }}
            placeholder="e.g. hermes mcp server"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute block mb-1.5">
            File Slug
          </label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="hermes-mcp-server" />
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute">
          Source Transcript
        </label>
        <div className="flex gap-2">
          <button className="rounded-lg border border-emerald/50 px-3 py-1 font-mono text-[10px] uppercase text-emerald hover:bg-emerald/10">
            Pick existing
          </button>
          <button className="rounded-lg border border-line px-3 py-1 font-mono text-[10px] uppercase text-cream-dim hover:text-cream">
            Paste new
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 mb-5">
        {TRANSCRIPTS.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelected(t.name)}
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 font-mono text-xs transition-colors ${
              selected === t.name
                ? "border-gold/60 bg-gold/10 text-cream"
                : "border-line-soft bg-bg-deep/40 text-cream-dim hover:border-gold/30"
            }`}
          >
            <span className="truncate">{t.name}</span>
            <span className="text-cream-mute ml-3">{t.size}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setAutoDeploy(!autoDeploy)}
        className={`w-full mb-5 flex items-center justify-between rounded-xl border px-4 py-3.5 transition-colors ${
          autoDeploy ? "border-plum/50 bg-plum/10" : "border-line-soft bg-bg-deep/40"
        }`}
      >
        <div className="flex items-center gap-3 text-left">
          <Rocket size={16} className="text-plum" />
          <div>
            <div className="text-sm font-medium text-cream">Auto-deploy after generate</div>
            <div className="text-xs text-cream-dim">
              As soon as Claude finishes writing, all 5 sites build + deploy in parallel.
            </div>
          </div>
        </div>
        <span
          className={`relative h-6 w-11 rounded-full transition-colors ${autoDeploy ? "bg-plum" : "bg-bg-elev"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-transform ${
              autoDeploy ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[10px] text-cream-mute">
          Writes to all 5 sites · ⚠ Live filesystem writes{!selected && " · no transcript"}
        </span>
        <GoldButton onClick={generate} disabled={running || !keyword.trim() || !selected}>
          ▶ {running ? "Generating…" : "Generate 5 articles"}
        </GoldButton>
      </div>
    </Card>
  );
}

function ResearchPanel() {
  const rows = [
    { kw: "hermes agent os", pos: 7, imps: "12,402", ctr: "1.1%", action: "page 2 → 1 push" },
    { kw: "agent os dashboard", pos: 11, imps: "8,911", ctr: "0.4%", action: "striking distance" },
    { kw: "free claude code", pos: 5, imps: "21,003", ctr: "0.9%", action: "CTR leak — rewrite title" },
    { kw: "obsidian ai memory", pos: 14, imps: "5,677", ctr: "0.2%", action: "striking distance" },
  ];
  return (
    <Card className="p-6">
      <h3 className="font-display font-semibold text-cream text-xl mb-1">
        Your real Search Console picks the targets
      </h3>
      <p className="text-sm text-cream-dim mb-5">
        Keywords in striking distance (positions 5–20) and CTR leaks, straight from the GSC API — no third-party guessing.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft font-mono text-[10px] uppercase tracking-[0.15em] text-cream-mute">
              <th className="text-left py-2 pr-4">Keyword</th>
              <th className="text-right py-2 pr-4">Pos</th>
              <th className="text-right py-2 pr-4">Impressions</th>
              <th className="text-right py-2 pr-4">CTR</th>
              <th className="text-left py-2 pr-4">Play</th>
              <th className="text-right py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kw} className="border-b border-line-soft/50">
                <td className="py-3 pr-4 font-mono text-cream">{r.kw}</td>
                <td className="py-3 pr-4 text-right font-mono text-gold">{r.pos}</td>
                <td className="py-3 pr-4 text-right font-mono text-cream-dim">{r.imps}</td>
                <td className="py-3 pr-4 text-right font-mono text-plum">{r.ctr}</td>
                <td className="py-3 pr-4 text-cream-dim">{r.action}</td>
                <td className="py-3 text-right">
                  <button className="rounded-full border border-emerald/50 px-3 py-1 font-mono text-[10px] text-emerald hover:bg-emerald/10">
                    → Generate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 font-mono text-[10px] text-cream-mute">
        Connect GSC via service account in Settings → env GSC_SERVICE_ACCOUNT_JSON. Read-only.
      </p>
    </Card>
  );
}

export default function SeoPage() {
  const [tab, setTab] = React.useState("generate");

  return (
    <div>
      <PageHeader
        numeral="X."
        section="Self · SEO Pipeline"
        title="SEO Content Pipeline"
        subtitle="Pick a keyword + transcript. Generate 5 unique articles. Deploy to your Netlify funnel."
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {SEO_TABS.map((t) => (
          <Pill
            key={t.id}
            active={tab === t.id}
            tone={t.id === "generate" ? "emerald" : "default"}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={12} />
            {t.label}
            {t.id === "history" && <span className="font-mono text-[10px]">15</span>}
          </Pill>
        ))}
        <div className="ml-auto flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm text-cream-dim hover:text-cream">
            <BookOpen size={13} /> Setup Guide
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-emerald/60 px-4 py-1.5 text-sm text-emerald hover:bg-emerald/10">
            <Package size={13} /> SEO Pack (.zip)
          </button>
        </div>
      </div>

      {tab === "generate" && <GeneratePanel />}
      {tab === "research" && <ResearchPanel />}
      {!["generate", "research"].includes(tab) && (
        <Card className="p-10 text-center">
          <div className="text-3xl text-gold mb-3">✦</div>
          <p className="text-cream-mute text-sm max-w-[52ch] mx-auto">
            {SEO_TABS.find((t) => t.id === tab)?.label} — part of the pipeline: research → write ×5 →
            deploy ×5 → index → measure → loop back to research.
          </p>
        </Card>
      )}
    </div>
  );
}
