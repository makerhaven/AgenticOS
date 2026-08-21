"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Paperclip,
  MessagesSquare,
  Workflow,
  SquareKanban,
  Target,
  TrendingUp,
  Clapperboard,
  Palette,
  NotebookPen,
  BookOpenText,
  Brain,
  Settings,
  Command,
  BarChart3,
  MoreHorizontal,
  Home,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { CommandPalette } from "./CommandPalette";

const NAV = {
  workspace: [{ id: "mission", label: "Mission Control", href: "/control", icon: LayoutGrid }],
  orchestration: [
    { id: "paperclip", label: "Paperclip", href: "/control/paperclip", icon: Paperclip },
    { id: "mastermind", label: "AI Agent Mastermind", href: "/control/mastermind", icon: MessagesSquare },
    { id: "pipeline", label: "Pipeline", href: "/control/pipeline", icon: Workflow },
    { id: "kanban", label: "Agent Kanban", href: "/control/kanban", icon: SquareKanban },
  ],
  self: [
    { id: "goals", label: "Goals", href: "/control/goals", icon: Target },
    { id: "seo", label: "SEO", href: "/control/seo", icon: TrendingUp },
    { id: "video", label: "Video", href: "/control/kanban?board=video-studio", icon: Clapperboard },
    { id: "studio", label: "Studio", href: "/control/studio", icon: Palette },
    { id: "notebook", label: "Notebook", href: "/control/notebook", icon: NotebookPen },
    { id: "journal", label: "Journal", href: "/control/journal", icon: BookOpenText },
    { id: "memory", label: "Memory", href: "/control/memory", icon: Brain },
    { id: "settings", label: "Settings", href: "/control/settings", icon: Settings },
  ],
};

function NavRow({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-bg-elev text-cream border-l-2 border-gold"
          : "text-cream-dim hover:text-cream hover:bg-bg-card"
      }`}
    >
      <Icon size={16} className={active ? "text-gold" : "text-cream-mute"} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function AgentRow({
  id,
  name,
  glyph,
  hue,
  active,
}: {
  id: string;
  name: string;
  glyph: string;
  hue: string;
  active: boolean;
}) {
  return (
    <Link
      href={`/control/agents/${id}`}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-bg-elev text-cream border-l-2 border-gold" : "text-cream-dim hover:text-cream hover:bg-bg-card"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${hue} text-[11px] font-bold text-bg-deep shrink-0`}
      >
        {glyph}
      </span>
      <span className="truncate">{name}</span>
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => {
    const [p] = href.split("?");
    if (p === "/control") return pathname === "/control" || pathname === "/control/";
    return pathname.startsWith(p);
  };

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line-soft bg-bg-mid lg:flex">
        <div className="px-5 pt-5 pb-4">
          <div className="font-mono text-[10px] tracking-[0.3em] text-cream-mute uppercase mb-1">
            Local · Studio
          </div>
          <div className="font-display font-semibold text-cream text-xl tracking-tight">
            Agentic <span className="font-hand text-gold italic text-2xl">OS</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
          <div>
            <div className="px-3 mb-1.5 font-mono text-[10px] tracking-[0.25em] text-cream-mute uppercase">
              Workspace
            </div>
            {NAV.workspace.map((i) => (
              <NavRow key={i.id} href={i.href} icon={i.icon} label={i.label} active={isActive(i.href)} />
            ))}
          </div>

          <div>
            <div className="px-3 mb-1.5 font-mono text-[10px] tracking-[0.25em] text-cream-mute uppercase">
              Agent Orchestration
            </div>
            {NAV.orchestration.map((i) => (
              <NavRow key={i.id} href={i.href} icon={i.icon} label={i.label} active={isActive(i.href)} />
            ))}
          </div>

          <div>
            <div className="px-3 mb-1.5 font-mono text-[10px] tracking-[0.25em] text-cream-mute uppercase">
              Agents
            </div>
            {AGENTS.map((a) => (
              <AgentRow
                key={a.id}
                id={a.id}
                name={a.name}
                glyph={a.glyph}
                hue={a.hue}
                active={pathname === `/control/agents/${a.id}`}
              />
            ))}
          </div>

          <div>
            <div className="px-3 mb-1.5 font-mono text-[10px] tracking-[0.25em] text-cream-mute uppercase">
              Self
            </div>
            {NAV.self.map((i) => (
              <NavRow key={i.id} href={i.href} icon={i.icon} label={i.label} active={isActive(i.href)} />
            ))}
          </div>

          <div className="pt-2 border-t border-line-soft">
            <div className="px-3 mb-1.5 font-mono text-[10px] tracking-[0.25em] text-cream-mute uppercase">
              Wired
            </div>
            <div className="px-3 font-mono text-[10px] text-cream-mute">claude · openclaw · hermes</div>
            <div className="mt-2 flex items-center gap-2 px-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black font-display text-[11px] text-cream border border-line-soft">
                N
              </span>
              <span className="font-mono text-[10px] text-cream-mute">…dian vault</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald" />
            </div>
          </div>
        </nav>
      </aside>

      {/* Top bar */}
      <div className="fixed top-0 right-0 left-0 lg:left-60 z-30 flex items-center justify-end gap-3 border-b border-line-soft bg-bg-deep/80 px-4 py-3 backdrop-blur-md lg:px-8">
        <button
          onClick={() => setPaletteOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-card px-4 py-1.5 font-mono text-xs text-cream-dim hover:border-gold/40 hover:text-cream transition-colors"
        >
          <Command size={12} />K Command palette
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-card px-4 py-1.5 font-mono text-xs text-cream-dim">
          <BarChart3 size={12} className="text-emerald" />
          ALL SYSTEMS
        </div>
      </div>

      {/* Content */}
      <main className="px-4 pt-24 pb-28 lg:px-10 lg:pb-16 max-w-[1400px] mx-auto">{children}</main>

      {/* Mobile bottom nav — Pocket Mission Control */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-line-soft bg-bg-mid/95 py-2 backdrop-blur-md lg:hidden">
        <Link href="/control" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${pathname === "/control" ? "text-gold" : "text-cream-mute"}`}>
          <Home size={18} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/control/agents/hermes" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${pathname.startsWith("/control/agents") ? "text-gold" : "text-cream-mute"}`}>
          <LayoutGrid size={18} />
          <span className="text-[10px] font-medium">Agents</span>
        </Link>
        <Link href="/control/kanban" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${pathname.startsWith("/control/kanban") ? "text-gold" : "text-cream-mute"}`}>
          <SquareKanban size={18} />
          <span className="text-[10px] font-medium">Kanban</span>
        </Link>
        <Link href="/control/memory" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${pathname.startsWith("/control/memory") ? "text-gold" : "text-cream-mute"}`}>
          <Brain size={18} />
          <span className="text-[10px] font-medium">Memory</span>
        </Link>
        <Link href="/control/settings" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${pathname.startsWith("/control/settings") ? "text-gold" : "text-cream-mute"}`}>
          <MoreHorizontal size={18} />
          <span className="text-[10px] font-medium">More</span>
        </Link>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
