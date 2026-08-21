import { NextResponse } from "next/server";
import { listNotes, readNote, writeNote, searchNotes } from "@/lib/vault";
import { publish } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const q = searchParams.get("q");

  if (slug) {
    const note = readNote(slug);
    if (!note) return new NextResponse("not found", { status: 404 });
    return NextResponse.json(note);
  }
  if (q) return NextResponse.json({ notes: searchNotes(q) });
  return NextResponse.json({ notes: listNotes() });
}

export async function POST(request: Request) {
  const { slug, content } = (await request.json()) as { slug: string; content: string };
  if (!slug || content === undefined) return new NextResponse("slug and content required", { status: 400 });
  const ok = writeNote(slug, content);
  if (ok) publish("memory", `Note saved: ${slug}`);
  return NextResponse.json({ ok });
}
