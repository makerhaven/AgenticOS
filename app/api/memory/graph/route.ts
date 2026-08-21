import { NextResponse } from "next/server";
import { buildGalaxy } from "@/lib/indexer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("refresh") === "1";
  return NextResponse.json(await buildGalaxy(force));
}
