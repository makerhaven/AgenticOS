import { NextResponse } from "next/server";
import { getCards, saveCards, nowIso } from "@/lib/store";
import { publish } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Dispatch: the orchestrator sweeps TRIAGE, decomposes each card into
 * subtasks (mock: two derived cards), and advances work one lane.
 */
export async function POST(request: Request) {
  const { board = "default" } = (await request.json().catch(() => ({}))) as { board?: string };
  const cards = getCards();
  const triaged = cards.filter((c) => c.board === board && c.column === "triage");

  for (const c of triaged) {
    c.column = "ready";
    c.updatedAt = nowIso();
    publish("kanban", `Dispatcher decomposed “${c.title}” → ready`);
  }

  // Advance one running→done as the mock worker completing something.
  const running = cards.find((c) => c.board === board && c.column === "running");
  if (running) {
    running.column = "done";
    running.summary = "Completed by worker agent (mock). Output filed to workspace.";
    running.updatedAt = nowIso();
    publish("kanban", `Worker finished “${running.title}” ✓`);
  }

  saveCards(cards);
  return NextResponse.json({ dispatched: triaged.length, completed: running ? 1 : 0 });
}
