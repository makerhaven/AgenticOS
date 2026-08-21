import { NextResponse } from "next/server";
import { getGoals, saveGoals, uid, nowIso, type Goal } from "@/lib/store";
import { publish } from "@/lib/events";
import { appendJournal } from "@/lib/vault";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ goals: getGoals().reverse() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; prompt: string; agent?: string };
  if (!body.prompt?.trim()) return new NextResponse("prompt required", { status: 400 });

  const goals = getGoals();
  const goal: Goal = {
    id: uid("g"),
    title: body.title?.trim() || body.prompt.split(/\s+/).slice(0, 7).join(" "),
    prompt: body.prompt,
    agent: body.agent ?? "hermes",
    status: "planning",
    turns: 0,
    maxTurns: 50,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    log: ["Goal accepted. Planning…"],
  };
  goals.push(goal);
  saveGoals(goals);
  publish("goal", `Goal launched: “${goal.title}”`);
  appendJournal(`Launched goal: **${goal.title}** — ${body.prompt.slice(0, 120)}`, "Goal Mode");
  return NextResponse.json({ goal });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id: string; action: "tick" | "stop" };
  const goals = getGoals();
  const goal = goals.find((g) => g.id === body.id);
  if (!goal) return new NextResponse("not found", { status: 404 });

  if (body.action === "stop") {
    goal.status = "failed";
    goal.log.push("Stopped by user.");
  } else if (body.action === "tick" && goal.status !== "done" && goal.status !== "failed") {
    goal.turns = Math.min(goal.turns + 1, goal.maxTurns);
    const phases: Goal["status"][] = ["planning", "working", "working", "checking"];
    goal.status = goal.turns >= goal.maxTurns ? "done" : phases[goal.turns % phases.length];
    goal.log.push(
      goal.status === "done"
        ? "Done. Summary written to the vault."
        : `Turn ${goal.turns}: ${goal.status}…`
    );
    if (goal.status === "done") {
      publish("goal", `Goal complete: “${goal.title}” ✓`);
      appendJournal(`Goal complete: **${goal.title}** (${goal.turns} turns)`, "Goal Mode");
    }
  }
  goal.updatedAt = nowIso();
  saveGoals(goals);
  return NextResponse.json({ goal });
}
