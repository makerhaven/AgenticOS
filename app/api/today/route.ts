import { NextResponse } from "next/server";
import { getToday, saveToday, uid, nowIso } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: getToday() });
}

export async function POST(request: Request) {
  const { text } = (await request.json()) as { text: string };
  if (!text?.trim()) return new NextResponse("text required", { status: 400 });
  const items = getToday();
  const heading = text.trim().startsWith("#");
  const item = {
    id: uid("td"),
    text: heading ? text.trim().replace(/^#+\s*/, "") : text.trim(),
    heading,
    done: false,
    createdAt: nowIso(),
  };
  items.push(item);
  saveToday(items);
  return NextResponse.json({ item });
}

export async function PATCH(request: Request) {
  const { id, done } = (await request.json()) as { id: string; done: boolean };
  const items = getToday();
  const item = items.find((i) => i.id === id);
  if (!item) return new NextResponse("not found", { status: 404 });
  item.done = done;
  saveToday(items);
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  saveToday(getToday().filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}
