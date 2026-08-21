"use client";

import React from "react";
import { GripVertical, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader, Card, Input } from "@/components/ui";

interface ModelProfile {
  name: string;
  provider: string;
  tier: number;
  ctx: string;
}

const DEFAULT_PROFILES: ModelProfile[] = [
  { name: "ollama-local", provider: "Local", tier: 0, ctx: "32k" },
  { name: "owl-alpha (free)", provider: "OpenRouter", tier: 0, ctx: "1M" },
  { name: "glm-5.2", provider: "Z.ai", tier: 1, ctx: "200k" },
  { name: "kimi-k3", provider: "OpenRouter", tier: 1, ctx: "900k" },
  { name: "claude-code", provider: "Anthropic", tier: 2, ctx: "1M" },
];

export default function SettingsPage() {
  const [profiles] = React.useState(DEFAULT_PROFILES);
  const [vaultPath, setVaultPath] = React.useState("./vault");
  const keys = [
    { name: "OPENROUTER_API_KEY", set: false },
    { name: "ANTHROPIC_API_KEY", set: false },
    { name: "GEMINI_API_KEY", set: false },
    { name: "CONTROL_PASSCODE", set: false },
  ];

  return (
    <div>
      <PageHeader
        numeral="XX."
        section="Self · Settings"
        title="Settings"
        subtitle="The router, the vault, the schedule, the keys — one screen to tune the whole machine."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-cream text-lg mb-1">Model router</h3>
          <p className="text-xs text-cream-dim mb-4">
            Each job goes to the cheapest profile that can do it well. Tier 0 free/local → tier 1 budget → tier 2 premium for the hardest ~5%.
          </p>
          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-xl border border-line-soft bg-bg-deep/40 px-4 py-3"
              >
                <GripVertical size={14} className="text-cream-mute" />
                <div className="flex-1">
                  <div className="font-mono text-sm text-cream">{p.name}</div>
                  <div className="font-mono text-[10px] text-cream-mute">
                    {p.provider} · {p.ctx} ctx
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
                    p.tier === 0
                      ? "bg-emerald/10 text-emerald"
                      : p.tier === 1
                        ? "bg-gold/10 text-gold"
                        : "bg-plum/10 text-plum"
                  }`}
                >
                  tier {p.tier}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-display font-semibold text-cream text-lg mb-4">Memory vault</h3>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-mute block mb-1.5">
              VAULT_PATH
            </label>
            <Input value={vaultPath} onChange={(e) => setVaultPath(e.target.value)} />
            <p className="mt-3 text-xs text-cream-mute">
              Point at your real Obsidian vault. The Memory Galaxy rebuilds on file change. Set via env on the server.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-display font-semibold text-cream text-lg mb-4">Keys (env-only)</h3>
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.name} className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-deep/40 px-4 py-2.5">
                  <span className="font-mono text-xs text-cream">{k.name}</span>
                  {k.set ? (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-emerald">
                      <CheckCircle2 size={12} /> set
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-cream-mute">
                      <XCircle size={12} /> not set — mock mode
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-cream-mute">
              Secrets never render here — presence only. Values live in .env on the server.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-display font-semibold text-cream text-lg mb-4">Scheduler</h3>
            {["Oracle — every 4h", "Muse — daily 06:20"].map((j) => (
              <label key={j} className="flex items-center justify-between py-2 text-sm text-cream-dim cursor-pointer">
                <span className="font-mono text-xs">{j}</span>
                <input type="checkbox" className="h-4 w-4 accent-[#5ab896]" />
              </label>
            ))}
            <p className="mt-2 text-xs text-cream-mute">Set once, runs forever. Jobs write their reports into the vault.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
