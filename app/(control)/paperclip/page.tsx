import { PageHeader, Card, EmptyState } from "@/components/ui";

export default function PaperclipPage() {
  return (
    <div>
      <PageHeader
        numeral="II."
        section="Agent Orchestration · Paperclip"
        title="Paperclip"
        subtitle="The inbound inbox. Files dropped here are filed into vault/inbox and routed to the right agent."
      />
      <Card className="p-10 border-dashed">
        <EmptyState
          icon="📎"
          text="Drop files onto this page or into vault/inbox — the librarian files them, links them, and the right agent picks them up."
        />
      </Card>
    </div>
  );
}
