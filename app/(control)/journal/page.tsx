import { listNotes } from "@/lib/vault";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function JournalPage() {
  const entries = listNotes().filter((n) => n.folder.startsWith("Journal"));

  return (
    <div>
      <PageHeader
        numeral="XIV."
        section="Self · Journal"
        title="Journal"
        subtitle="Your auto-logged build journal. Every agent run, kanban completion and goal lands here — one page per day."
      />
      {entries.length === 0 ? (
        <Card className="p-10">
          <EmptyState
            icon="✎"
            text="No journal entries yet. Move a kanban card to Done or launch a goal — the OS writes the day's page itself."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((n) => (
            <Link key={n.slug} href={`/control/memory`}>
              <Card hover className="p-5 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-semibold text-cream">{n.title}</span>
                  <span className="font-mono text-[10px] text-cream-mute">
                    {new Date(n.mtime).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-cream-dim line-clamp-2">{n.snippet}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
