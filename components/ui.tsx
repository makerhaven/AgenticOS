"use client";

import React from "react";

/** Shared visual primitives in the Agentic OS design language. */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-hand text-gold text-2xl tracking-wide mb-1 select-none">
      {children}
    </div>
  );
}

export function PageHeader({
  numeral,
  section,
  title,
  subtitle,
}: {
  numeral: string;
  section: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-8">
      <div className="flex items-baseline gap-4 mb-2">
        <span className="font-hand text-gold text-2xl italic">{numeral}</span>
        <span className="font-mono text-cream-mute text-xs tracking-[0.25em] uppercase">
          — {section}
        </span>
      </div>
      <h1 className="font-display font-bold text-cream text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02] tracking-[-0.035em] mb-3">
        {title}
      </h1>
      <p className="text-cream-soft text-lg max-w-[62ch]">{subtitle}</p>
      <MetaRow />
    </header>
  );
}

export function MetaRow() {
  const [time, setTime] = React.useState("");
  React.useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="font-mono text-gold-deep text-xs tracking-[0.2em] mt-4 uppercase">
      {time || "--:--"} · Local · Studio
    </div>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border border-line bg-gradient-to-b from-bg-card to-bg-mid shadow-[var(--shadow-card)] ${
        hover
          ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] hover:border-gold/50"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusDot({
  status,
  className = "",
}: {
  status: "online" | "offline" | "idle";
  className?: string;
}) {
  const color =
    status === "online"
      ? "bg-emerald shadow-[0_0_8px_rgba(90,184,150,0.8)]"
      : status === "offline"
        ? "bg-plum"
        : "bg-gold";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} ${className}`} />;
}

export function Pill({
  children,
  active = false,
  href,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "emerald" | "gold";
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors whitespace-nowrap";
  const styles = active
    ? tone === "emerald"
      ? "border-emerald text-emerald bg-emerald/10"
      : tone === "gold"
        ? "border-gold text-gold bg-gold/10"
        : "border-gold/60 text-cream bg-bg-elev"
    : "border-line text-cream-dim bg-bg-card/60 hover:text-cream hover:border-gold/40";
  const cls = `${base} ${styles}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls} type="button">
      {children}
    </button>
  );
}

export function GoldButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-soft to-gold-deep text-bg-deep font-display font-bold px-6 py-2.5 text-sm tracking-tight shadow-[0_6px_16px_rgba(212,165,116,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(212,165,116,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}

export function Divider() {
  return (
    <div className="relative my-12 flex items-center justify-center">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <span className="relative bg-bg-deep px-4 text-gold text-sm">✦</span>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 py-2.5 text-sm text-cream placeholder:text-cream-mute focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 py-3 text-sm text-cream placeholder:text-cream-mute focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 ${props.className ?? ""}`}
    />
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl text-gold mb-4">{icon}</div>
      <p className="text-cream-mute text-sm">{text}</p>
    </div>
  );
}
