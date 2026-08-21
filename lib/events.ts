import "server-only";

/**
 * In-process activity bus. Subsystems publish; the /api/activity SSE route
 * fans events out to every open Mission Control screen.
 */

export interface ActivityEvent {
  id: string;
  kind: "agent" | "kanban" | "goal" | "memory" | "system" | "chat";
  text: string;
  at: string;
}

type Listener = (e: ActivityEvent) => void;

const listeners = new Set<Listener>();
const recent: ActivityEvent[] = [];

export function publish(kind: ActivityEvent["kind"], text: string): ActivityEvent {
  const e: ActivityEvent = {
    id: `ev_${Math.random().toString(36).slice(2, 10)}`,
    kind,
    text,
    at: new Date().toISOString(),
  };
  recent.push(e);
  if (recent.length > 200) recent.shift();
  for (const fn of listeners) fn(e);
  return e;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function recentActivity(limit = 50): ActivityEvent[] {
  return recent.slice(-limit).reverse();
}
