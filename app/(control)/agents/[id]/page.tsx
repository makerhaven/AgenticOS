import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { AgentPanel } from "./panel";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) notFound();
  return <AgentPanel agent={agent} />;
}

export function generateStaticParams() {
  return [
    "claude",
    "openclaw",
    "hermes",
    "gemini",
    "antigravity",
    "codex",
    "kimi",
    "glm",
    "grok",
    "freeclaude",
    "fusion",
  ].map((id) => ({ id }));
}
