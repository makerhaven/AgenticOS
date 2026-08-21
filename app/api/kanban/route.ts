import { NextResponse } from "next/server";
import {
  getCards,
  saveCards,
  uid,
  nowIso,
  type KanbanCard,
  type KanbanColumn,
} from "@/lib/store";
import { publish } from "@/lib/events";
import { appendJournal } from "@/lib/vault";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const board = searchParams.get("board") ?? "default";
  return NextResponse.json({ cards: getCards(board) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<KanbanCard>;
  const cards = getCards();
  const card: KanbanCard = {
    id: uid("t"),
    board: body.board ?? "default",
    title: body.title?.trim() || "Untitled task",
    assignee: body.assignee ?? "you",
    column: body.column ?? "triage",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  cards.push(card);
  saveCards(cards);
  publish("kanban", `New card in ${card.column}: “${card.title}”`);
  return NextResponse.json({ card });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id: string;
    column?: KanbanColumn;
    summary?: string;
    answer?: string;
  };
  const cards = getCards();
  const card = cards.find((c) => c.id === body.id);
  if (!card) return new NextResponse("not found", { status: 404 });

  if (body.column) {
    const from = card.column;
    card.column = body.column;
    card.updatedAt = nowIso();
    publish("kanban", `“${card.title}” moved ${from} → ${body.column}`);
  }
  if (body.summary !== undefined) {
    card.summary = body.summary;
    appendJournal(`**${card.title}** — ${body.summary}`, "Kanban · Done");
  }
  if (body.answer !== undefined) {
    // Answer a blocked card's question → resume to ready.
    card.question = undefined;
    card.column = "ready";
    card.updatedAt = nowIso();
    publish("kanban", `“${card.title}” unblocked and back to ready`);
  }
  saveCards(cards);
  return NextResponse.json({ card });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("id required", { status: 400 });
  saveCards(getCards().filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
