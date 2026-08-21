import { PageHeader, Card, EmptyState } from "@/components/ui";

export default function NotebookPage() {
  return (
    <div>
      <PageHeader
        numeral="XII."
        section="Self · Notebook"
        title="Notebook"
        subtitle="NotebookLM research, wired in. Notebooks, sources, and every generated asset — audio overviews, mind maps, briefings — pull straight into your workspace."
      />
      <Card className="p-10">
        <EmptyState
          icon="📓"
          text="Connect a NotebookLM MCP bridge in Settings, or drop exports into vault/inbox — notebooks and their 12 asset types appear here."
        />
      </Card>
    </div>
  );
}
