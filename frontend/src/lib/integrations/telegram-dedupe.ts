import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface DedupeFile {
  keys: string[];
}

function dedupePath(): string {
  const dir = process.env.CARE_JSONL_DIR ?? path.join(process.cwd(), "..", "data");
  return path.join(dir, "telegram-dedupe.json");
}

async function readStore(): Promise<DedupeFile> {
  try {
    const raw = await readFile(dedupePath(), "utf8");
    const parsed = JSON.parse(raw) as DedupeFile;
    return { keys: Array.isArray(parsed.keys) ? parsed.keys : [] };
  } catch {
    return { keys: [] };
  }
}

export async function wasTelegramAlertSent(key: string): Promise<boolean> {
  const store = await readStore();
  return store.keys.includes(key);
}

export async function markTelegramAlertSent(key: string): Promise<void> {
  const store = await readStore();
  if (store.keys.includes(key)) return;

  store.keys.push(key);
  if (store.keys.length > 500) {
    store.keys = store.keys.slice(-500);
  }

  const file = dedupePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2) + "\n");
}
