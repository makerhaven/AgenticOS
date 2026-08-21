import "server-only";

import { AGENTS } from "./agents";
import { addLedger } from "./store";
import { appendJournal } from "./vault";

/**
 * Agent adapters — one contract behind every agent tab so the UI never cares
 * which harness is underneath. Real adapters (Claude Code CLI, Hermes gateway,
 * OpenClaw) plug in here; the mock adapter runs the entire UI with zero keys.
 */

export interface AgentStatus {
  id: string;
  online: boolean;
  label: string; // big value: Online / Offline / Live
  sub: string; // mono sub-line: version · latency / model · provider
  latencyMs?: number;
}

export interface ChatEvent {
  type: "token" | "tool" | "done";
  text?: string;
  tool?: { name: string; args: string; durationMs: number };
}

const MOCK_REPLIES: Record<string, string> = {
  default:
    "Understood. I've pulled your business context from the vault and I'm on it. I'll write the outcome back to today's journal when I'm done.",
  claude:
    "I've read the vault context and your goals. I'll take the hard-thinking part of this one — expect a plan first, then the build, with everything logged.",
  hermes:
    "On it. I'll decompose this into steps and work through them in the background. Check Goal Mode or the Kanban for progress — I'll report into the vault when finished.",
  openclaw:
    "Got it. Running locally, so this stays on your machine. I'll stream progress here and file the result in the workspace.",
  freeclaude:
    "Routed through a free model — this run costs you $0.00. Building now; the output will land in the workspace when it's done.",
};

const MOCK_TOOLS = [
  { name: "vault.read", args: "Business Context/" },
  { name: "web.search", args: '"agent os" latest' },
  { name: "file.write", args: "workspaces/draft.md" },
];

export async function getAgentStatuses(): Promise<AgentStatus[]> {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  return AGENTS.map((a) => {
    // Without keys, simulate a healthy mix so the UI is fully explorable.
    const online =
      a.id === "claude"
        ? true
        : a.id === "freeclaude"
          ? hasOpenRouter
          : a.id === "openclaw"
            ? false
            : true;

    const latency = 38 + Math.floor(Math.random() * 60);
    const sub =
      a.id === "claude"
        ? `2.1.220 · ${latency}ms`
        : a.id === "openclaw"
          ? "0 agents · 0 sessions"
          : a.id === "hermes"
            ? "kimi-k3 · OpenRouter"
            : a.id === "freeclaude"
              ? hasOpenRouter
                ? "gemini-3.6-flash · free"
                : "fcc-server down"
              : `${a.provider} · ${latency}ms`;

    return {
      id: a.id,
      online,
      label: a.id === "freeclaude" ? (hasOpenRouter ? "Live" : "Offline") : online ? "Online" : "Offline",
      sub,
      latencyMs: online ? latency : undefined,
    };
  });
}

export async function* chatWithAgent(
  agentId: string,
  message: string
): AsyncGenerator<ChatEvent> {
  const reply = MOCK_REPLIES[agentId] ?? MOCK_REPLIES.default;

  // Occasionally prepend a mock tool call so the chat shows tool chips.
  if (Math.random() > 0.4) {
    const tool = MOCK_TOOLS[Math.floor(Math.random() * MOCK_TOOLS.length)];
    const durationMs = 120 + Math.floor(Math.random() * 900);
    await new Promise((r) => setTimeout(r, 350));
    yield { type: "tool", tool: { ...tool, durationMs } };
  }

  // Stream token-ish chunks.
  const words = reply.split(" ");
  for (const w of words) {
    await new Promise((r) => setTimeout(r, 24));
    yield { type: "token", text: w + " " };
  }

  addLedger({
    agentId,
    model: agentId === "claude" ? "claude-code" : "mock-free",
    inTokens: Math.round(message.length / 4),
    outTokens: Math.round(reply.length / 4),
  });

  yield { type: "done" };
}

export function logRun(agentId: string, what: string): void {
  appendJournal(what, `Agent · ${agentId}`);
}
