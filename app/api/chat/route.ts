import { chatWithAgent } from "@/lib/adapters";
import { publish } from "@/lib/events";
import { getSessions, saveSessions, uid, nowIso } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { agentId, sessionId, message } = (await request.json()) as {
    agentId: string;
    sessionId?: string;
    message: string;
  };

  if (!agentId || !message) {
    return new Response("agentId and message required", { status: 400 });
  }

  // Persist the user message.
  const sessions = getSessions();
  let session = sessions.find((s) => s.id === sessionId && s.agentId === agentId);
  if (!session) {
    session = {
      id: sessionId || uid("s"),
      agentId,
      title: message.slice(0, 60),
      messages: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    sessions.push(session);
  }
  session.messages.push({ id: uid("m"), role: "user", text: message, createdAt: nowIso() });
  session.updatedAt = nowIso();
  saveSessions(sessions);

  publish("chat", `${agentId}: “${message.slice(0, 48)}${message.length > 48 ? "…" : ""}”`);

  const encoder = new TextEncoder();
  const sid = session.id;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "session", sessionId: sid })}\n\n`));
      let full = "";
      try {
        for await (const ev of chatWithAgent(agentId, message)) {
          if (ev.type === "token") full += ev.text ?? "";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
        }
      } finally {
        // Persist the agent reply.
        const all = getSessions();
        const s = all.find((x) => x.id === sid);
        if (s) {
          s.messages.push({ id: uid("m"), role: "agent", text: full, createdAt: nowIso() });
          s.updatedAt = nowIso();
          saveSessions(all);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  return Response.json({ sessions: getSessions(agentId ?? undefined) });
}
