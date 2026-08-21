import "server-only";

import fs from "fs";
import path from "path";

/**
 * Obsidian vault access — plain markdown files, wikilinks, frontmatter.
 * The vault is the system of record for all agent memory.
 */

export const VAULT_PATH = path.resolve(process.env.VAULT_PATH || path.join(process.cwd(), "vault"));

const VAULT_FOLDERS = ["Goals", "Journal", "Business Context", "Decisions", "Memory", "inbox"];

export function ensureVault(): void {
  if (!fs.existsSync(VAULT_PATH)) fs.mkdirSync(VAULT_PATH, { recursive: true });
  for (const f of VAULT_FOLDERS) {
    const p = path.join(VAULT_PATH, f);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
  const welcome = path.join(VAULT_PATH, "Business Context", "Welcome.md");
  if (!fs.existsSync(welcome)) {
    fs.writeFileSync(
      welcome,
      `---\ncreated: ${new Date().toISOString()}\ntags: [seed]\n---\n# Welcome to your Agentic OS vault\n\nThis folder of plain markdown is the shared brain every agent reads.\nLink notes together with [[Wikilinks]] — links become constellations in the [[Memory Galaxy]].\n\nSee also: [[How agents use this vault]]\n`
    );
    fs.writeFileSync(
      path.join(VAULT_PATH, "Business Context", "How agents use this vault.md"),
      `---\ncreated: ${new Date().toISOString()}\ntags: [seed]\n---\n# How agents use this vault\n\n- Agents read scoped context at session start.\n- Agents write outcomes and decisions at session end.\n- Every saved fact keeps its source (provenance).\n\nRelated: [[Welcome]]\n`
    );
  }
}

export function vaultOk(): boolean {
  try {
    ensureVault();
    fs.accessSync(VAULT_PATH, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export interface VaultNote {
  slug: string; // path relative to vault, no extension
  title: string;
  folder: string;
  mtime: string;
  snippet: string;
  links: string[]; // [[wikilink]] targets
}

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

export function extractLinks(content: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(content)) !== null) {
    out.push(m[1].split("|")[0].trim());
  }
  return out;
}

export function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n/, "");
}

function walk(dir: string, base: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, acc);
    else if (entry.name.endsWith(".md")) acc.push(path.relative(base, full));
  }
  return acc;
}

export function listNotes(): VaultNote[] {
  ensureVault();
  const files = walk(VAULT_PATH, VAULT_PATH);
  return files
    .map((rel) => {
      const full = path.join(VAULT_PATH, rel);
      let content = "";
      try {
        content = fs.readFileSync(full, "utf8");
      } catch {
        /* skip unreadable */
      }
      const body = stripFrontmatter(content);
      const stat = fs.statSync(full);
      return {
        slug: rel.replace(/\.md$/, ""),
        title: path.basename(rel, ".md"),
        folder: path.dirname(rel) === "." ? "" : path.dirname(rel),
        mtime: stat.mtime.toISOString(),
        snippet: body.replace(/[#*`>\[\]]/g, "").trim().slice(0, 160),
        links: extractLinks(content),
      };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));
}

export function readNote(slug: string): { content: string; meta: VaultNote } | null {
  ensureVault();
  const safe = path.normalize(slug).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(VAULT_PATH, `${safe}.md`);
  if (!full.startsWith(VAULT_PATH) || !fs.existsSync(full)) return null;
  const content = fs.readFileSync(full, "utf8");
  const stat = fs.statSync(full);
  return {
    content,
    meta: {
      slug: safe,
      title: path.basename(safe),
      folder: path.dirname(safe) === "." ? "" : path.dirname(safe),
      mtime: stat.mtime.toISOString(),
      snippet: stripFrontmatter(content).replace(/[#*`>\[\]]/g, "").trim().slice(0, 160),
      links: extractLinks(content),
    },
  };
}

export function writeNote(slug: string, content: string): boolean {
  ensureVault();
  const safe = path.normalize(slug).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(VAULT_PATH, `${safe}.md`);
  if (!full.startsWith(VAULT_PATH)) return false;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return true;
}

export function appendJournal(text: string, heading?: string): void {
  ensureVault();
  const day = new Date().toISOString().slice(0, 10);
  const full = path.join(VAULT_PATH, "Journal", `${day}.md`);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const stamp = new Date().toTimeString().slice(0, 5);
  const block = `${heading ? `\n## ${heading}\n` : ""}\n- **${stamp}** — ${text}\n`;
  fs.appendFileSync(full, fs.existsSync(full) ? block : `# Journal — ${day}\n${block}`);
}

export function searchNotes(q: string): VaultNote[] {
  const needle = q.toLowerCase();
  return listNotes().filter(
    (n) =>
      n.title.toLowerCase().includes(needle) ||
      n.snippet.toLowerCase().includes(needle) ||
      n.folder.toLowerCase().includes(needle)
  );
}
