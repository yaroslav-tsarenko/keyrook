import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { catalogConfig } from "@/config/catalog";
import type { Classified, RejectReason } from "./classify";
import type { Candidate } from "./select";

export interface StagingManifest {
  version: 1;
  runId: string;
  source: string;
  label: string;
  startedAt: string;
  totalPages: number | null;
  itemCount: number | null;
  pagesDone: number[];
  fetchComplete: boolean;
  chunksWritten: number;
  finished: boolean;
}

export interface PageStats {
  page: number;
  products: number;
  ids: number[];
  rejected: Partial<Record<RejectReason, number>>;
}

export interface StoredSelection {
  created: number;
  candidates: Pick<Candidate, "esaId" | "dedupeKey" | "title" | "displayName" | "sell" | "alternates" | "descriptionFrom">[];
}

export class Staging {
  readonly dir: string;

  constructor(dir = path.resolve(process.cwd(), catalogConfig.sync.stagingDir)) {
    this.dir = dir;
  }

  private file(name: string): string {
    return path.join(this.dir, name);
  }

  private pageName(page: number): string {
    return `page-${String(page).padStart(5, "0")}`;
  }

  private writeAtomic(name: string, body: string): void {
    const target = this.file(name);
    const tmp = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, body);
    fs.renameSync(tmp, target);
  }

  lock(): () => void {
    fs.mkdirSync(this.dir, { recursive: true });
    const file = path.join(path.dirname(this.dir), `${path.basename(this.dir)}.lock`);
    const mine = JSON.stringify({ pid: process.pid, host: os.hostname(), at: new Date().toISOString() });
    try {
      fs.writeFileSync(file, mine, { flag: "wx" });
    } catch {
      let holder: { pid?: number; host?: string; at?: string } = {};
      try {
        holder = JSON.parse(fs.readFileSync(file, "utf-8"));
      } catch {}
      let alive = false;
      if (holder.pid && holder.host === os.hostname()) {
        try {
          process.kill(holder.pid, 0);
          alive = true;
        } catch {}
      }
      if (alive) throw new Error(`Another catalogue sync is running (pid ${holder.pid}, started ${holder.at}). Wait for it to finish or stop it first.`);
      fs.writeFileSync(file, mine);
    }
    return () => {
      try {
        if (fs.readFileSync(file, "utf-8") === mine) fs.rmSync(file);
      } catch {}
    };
  }

  readManifest(): StagingManifest | null {
    try {
      const manifest = JSON.parse(fs.readFileSync(this.file("manifest.json"), "utf-8")) as StagingManifest;
      return manifest.version === 1 ? manifest : null;
    } catch {
      return null;
    }
  }

  resumable(source: string, maxAgeHours = catalogConfig.sync.resumeMaxAgeHours): StagingManifest | null {
    const manifest = this.readManifest();
    if (!manifest || manifest.finished || manifest.source !== source) return null;
    if (Date.now() - new Date(manifest.startedAt).getTime() > maxAgeHours * 3_600_000) return null;
    return manifest;
  }

  reset(manifest: StagingManifest): void {
    for (const name of fs.existsSync(this.dir) ? fs.readdirSync(this.dir) : []) fs.rmSync(this.file(name), { recursive: true, force: true });
    this.saveManifest(manifest);
  }

  saveManifest(manifest: StagingManifest): void {
    fs.mkdirSync(this.dir, { recursive: true });
    this.writeAtomic("manifest.json", JSON.stringify(manifest));
  }

  savePage(page: number, items: Classified[], stats: PageStats): void {
    this.writeAtomic(`${this.pageName(page)}.ndjson`, items.map((item) => JSON.stringify(item)).join("\n") + (items.length ? "\n" : ""));
    this.writeAtomic(`${this.pageName(page)}.json`, JSON.stringify(stats));
  }

  pages(): number[] {
    if (!fs.existsSync(this.dir)) return [];
    return fs
      .readdirSync(this.dir)
      .map((name) => /^page-(\d+)\.json$/.exec(name))
      .filter((m): m is RegExpExecArray => Boolean(m))
      .map((m) => Number(m[1]))
      .filter((page) => fs.existsSync(this.file(`${this.pageName(page)}.ndjson`)))
      .sort((a, b) => a - b);
  }

  pageStats(page: number): PageStats {
    return JSON.parse(fs.readFileSync(this.file(`${this.pageName(page)}.json`), "utf-8")) as PageStats;
  }

  async *items(): AsyncGenerator<Classified> {
    for (const page of this.pages()) {
      const stream = fs.createReadStream(this.file(`${this.pageName(page)}.ndjson`), { encoding: "utf-8" });
      const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
      for await (const line of lines) {
        if (!line) continue;
        const item = JSON.parse(line) as Classified & { releaseDate: string | null };
        yield { ...item, releaseDate: item.releaseDate ? new Date(item.releaseDate) : null };
      }
    }
  }

  saveSelection(selection: StoredSelection): void {
    this.writeAtomic("selection.json", JSON.stringify(selection));
  }

  readSelection(): StoredSelection | null {
    try {
      return JSON.parse(fs.readFileSync(this.file("selection.json"), "utf-8")) as StoredSelection;
    } catch {
      return null;
    }
  }

  clear(): void {
    for (const name of fs.existsSync(this.dir) ? fs.readdirSync(this.dir) : []) fs.rmSync(this.file(name), { recursive: true, force: true });
  }
}
