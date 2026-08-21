import "server-only";

import fs from "fs";
import path from "path";

/**
 * JSON-file-backed store. SQLite-free by design for portability on any VPS:
 * low-volume single-tenant state (kanban, goals, tasks, runs) lives in
 * data/*.json with atomic writes.
 */

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readJSON<T>(name: string, fallback: T): T {
  ensureDir();
  const p = path.join(DATA_DIR, `${name}.json`);
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(name: string, data: T): void {
  ensureDir();
  const p = path.join(DATA_DIR, `${name}.json`);
  const tmp = `${p}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, p);
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// ---------- Kanban ----------

export type KanbanColumn = "triage" | "todo" | "ready" | "running" | "blocked" | "done";

export interface KanbanCard {
  id: string;
  board: string;
  title: string;
  assignee: string;
  column: KanbanColumn;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  question?: string; // set when blocked
  profileId?: string;
}

export const KANBAN_COLUMNS: { id: KanbanColumn; label: string; accent: string; text: string }[] = [
  { id: "triage", label: "TRIAGE", accent: "border-t-plum", text: "text-plum" },
  { id: "todo", label: "TODO", accent: "border-t-cream-dim", text: "text-cream-dim" },
  { id: "ready", label: "READY", accent: "border-t-cyan-400", text: "text-cyan-300" },
  { id: "running", label: "RUNNING", accent: "border-t-gold", text: "text-gold" },
  { id: "blocked", label: "BLOCKED", accent: "border-t-red-500", text: "text-red-400" },
  { id: "done", label: "DONE", accent: "border-t-emerald", text: "text-emerald" },
];

export function getCards(board?: string): KanbanCard[] {
  const all = readJSON<KanbanCard[]>("kanban", []);
  return board ? all.filter((c) => c.board === board) : all;
}

export function saveCards(cards: KanbanCard[]): void {
  writeJSON("kanban", cards);
}

// ---------- Goals ----------

export type GoalStatus = "planning" | "working" | "checking" | "done" | "failed";

export interface Goal {
  id: string;
  title: string;
  prompt: string;
  agent: string;
  status: GoalStatus;
  turns: number;
  maxTurns: number;
  createdAt: string;
  updatedAt: string;
  log: string[];
}

export function getGoals(): Goal[] {
  return readJSON<Goal[]>("goals", []);
}

export function saveGoals(goals: Goal[]): void {
  writeJSON("goals", goals);
}

// ---------- Today list ----------

export interface TodayItem {
  id: string;
  text: string;
  heading: boolean;
  done: boolean;
  createdAt: string;
}

export function getToday(): TodayItem[] {
  return readJSON<TodayItem[]>("today", []);
}

export function saveToday(items: TodayItem[]): void {
  writeJSON("today", items);
}

// ---------- Chat sessions ----------

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  tool?: { name: string; args: string; durationMs: number };
  createdAt: string;
}

export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export function getSessions(agentId?: string): ChatSession[] {
  const all = readJSON<ChatSession[]>("sessions", []);
  return agentId ? all.filter((s) => s.agentId === agentId) : all;
}

export function saveSessions(sessions: ChatSession[]): void {
  writeJSON("sessions", sessions);
}

// ---------- Token ledger ----------

export interface TokenEntry {
  id: string;
  agentId: string;
  model: string;
  inTokens: number;
  outTokens: number;
  createdAt: string;
}

export function getLedger(): TokenEntry[] {
  return readJSON<TokenEntry[]>("ledger", []);
}

export function addLedger(entry: Omit<TokenEntry, "id" | "createdAt">): void {
  const rows = getLedger();
  rows.push({ ...entry, id: uid("t"), createdAt: nowIso() });
  writeJSON("ledger", rows.slice(-2000));
}

// ---------- Scheduler jobs ----------

export interface CronJob {
  id: string;
  name: string;
  agent: string;
  schedule: string;
  prompt: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: string;
}

export function getJobs(): CronJob[] {
  const jobs = readJSON<CronJob[]>("jobs", []);
  if (jobs.length === 0) {
    const seeded: CronJob[] = [
      {
        id: "j_oracle",
        name: "Oracle",
        agent: "hermes",
        schedule: "0 */4 * * *",
        prompt:
          "Check my competitors' sites and news. Write a short report into the vault flagging anything I should react to.",
        enabled: false,
      },
      {
        id: "j_muse",
        name: "Muse",
        agent: "hermes",
        schedule: "20 6 * * *",
        prompt:
          "Scan today's winning content in my niche, rank what's burning hottest, and write content ideas into the vault.",
        enabled: false,
      },
    ];
    writeJSON("jobs", seeded);
    return seeded;
  }
  return jobs;
}

export function saveJobs(jobs: CronJob[]): void {
  writeJSON("jobs", jobs);
}
