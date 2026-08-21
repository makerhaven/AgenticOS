export interface AgentDef {
  id: string;
  name: string;
  role: string;
  glyph: string; // short label for the icon tile
  hue: string; // gradient classes
  provider: string;
  tabs: string[]; // sub-tab pills for the agent panel
}

export const DEFAULT_TABS = ["Chat", "Workspace", "Control Room", "Manage"];

export const AGENTS: AgentDef[] = [
  {
    id: "claude",
    name: "Claude",
    role: "Direct streaming line to Claude Code. Full tool use, MCPs, plugins.",
    glyph: "+",
    hue: "from-orange-400 to-amber-600",
    provider: "Anthropic",
    tabs: DEFAULT_TABS,
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    role: "Local agent gateway. Chat one-shot or open the control room.",
    glyph: "🦞",
    hue: "from-pink-400 to-rose-600",
    provider: "Local",
    tabs: DEFAULT_TABS,
  },
  {
    id: "hermes",
    name: "Hermes",
    role: "Nous Research agent. Tool calls, kanban, skills, plugins.",
    glyph: "⚕",
    hue: "from-sky-400 to-blue-600",
    provider: "OpenRouter",
    tabs: [
      "Chat",
      "Apollo",
      "Oracle",
      "Muse",
      "Astros",
      "Studio",
      "Sessions",
      "Outreach",
      "Mixture",
      "Workspace",
      "MCPs",
      "Manage",
      "Control Room",
      "Goal Mode",
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Google's brain, wired into the same memory.",
    glyph: "✦",
    hue: "from-red-400 to-rose-500",
    provider: "Google",
    tabs: DEFAULT_TABS,
  },
  {
    id: "antigravity",
    name: "Antigravity",
    role: "Deep-space coding sibling for builds + reviews.",
    glyph: "⬆",
    hue: "from-violet-400 to-purple-600",
    provider: "Google",
    tabs: DEFAULT_TABS,
  },
  {
    id: "codex",
    name: "Codex",
    role: "OpenAI's coding agent for builds and reviews.",
    glyph: "❄",
    hue: "from-green-400 to-emerald-600",
    provider: "OpenAI",
    tabs: DEFAULT_TABS,
  },
  {
    id: "kimi",
    name: "Kimi Code",
    role: "Moonshot's agent for long-context builds.",
    glyph: "K",
    hue: "from-cyan-400 to-sky-600",
    provider: "Moonshot",
    tabs: DEFAULT_TABS,
  },
  {
    id: "glm",
    name: "GLM 5.2",
    role: "Opus-level workhorse at a sixth of the price. The long grind.",
    glyph: "G",
    hue: "from-teal-400 to-emerald-600",
    provider: "Z.ai",
    tabs: DEFAULT_TABS,
  },
  {
    id: "grok",
    name: "Grok Build",
    role: "xAI's builder — free on your X Premium+ plan.",
    glyph: "X",
    hue: "from-slate-300 to-slate-500",
    provider: "xAI",
    tabs: DEFAULT_TABS,
  },
  {
    id: "freeclaude",
    name: "Free Claude Code",
    role: "The real Claude Code tooling routed through free models. $0 builds.",
    glyph: "🆓",
    hue: "from-emerald-400 to-teal-600",
    provider: "OpenRouter",
    tabs: DEFAULT_TABS,
  },
  {
    id: "fusion",
    name: "Fusion",
    role: "A panel of models debates, a judge writes the final answer. For can't-be-wrong calls.",
    glyph: "⌘",
    hue: "from-fuchsia-400 to-purple-600",
    provider: "Multi",
    tabs: DEFAULT_TABS,
  },
];

export function getAgent(id: string): AgentDef | undefined {
  return AGENTS.find((a) => a.id === id);
}
