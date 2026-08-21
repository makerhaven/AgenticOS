import { NextResponse } from "next/server";
import { getAgentStatuses } from "@/lib/adapters";
import { vaultOk, listNotes } from "@/lib/vault";
import { getLedger } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const statuses = await getAgentStatuses();
  const notes = listNotes();
  const ledger = getLedger();
  const today = new Date().toISOString().slice(0, 10);
  const todayTokens = ledger
    .filter((t) => t.createdAt.startsWith(today))
    .reduce((s, t) => s + t.inTokens + t.outTokens, 0);

  const latencies = statuses.filter((s) => s.latencyMs).map((s) => s.latencyMs as number);
  const p50 = latencies.length
    ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)]
    : 0;

  return NextResponse.json({
    agents: statuses,
    vault: { ok: vaultOk(), noteCount: notes.length },
    heartbeat: { ticks: 1, intervalS: 4 },
    latencyP50: p50,
    todayTokens,
  });
}
