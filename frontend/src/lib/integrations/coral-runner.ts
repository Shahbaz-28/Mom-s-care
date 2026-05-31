import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CoralQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  raw: string;
}

function defaultCoralBin(): string {
  if (process.env.CORAL_BIN) return process.env.CORAL_BIN;
  const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
  return path.join(home, ".local", "bin", process.platform === "win32" ? "coral.exe" : "coral");
}

function projectRoot(): string {
  return process.env.MED_PROJECT_ROOT ?? path.join(process.cwd(), "..");
}

function parseCoralJson(stdout: string): CoralQueryResult {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return { columns: [], rows: [], raw: stdout };
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return { columns: [], rows: [], raw: stdout };
  }

  if (Array.isArray(data)) {
    const rows = data as Record<string, unknown>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows, raw: stdout };
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.rows)) {
      const rows = obj.rows as Record<string, unknown>[];
      const columns =
        Array.isArray(obj.columns) && obj.columns.length > 0
          ? (obj.columns as string[])
          : rows.length > 0
            ? Object.keys(rows[0])
            : [];
      return { columns, rows, raw: stdout };
    }
  }

  return { columns: [], rows: [], raw: stdout };
}

export async function runCoralSql(sql: string): Promise<CoralQueryResult> {
  const coralBin = defaultCoralBin();
  const cwd = projectRoot();

  const { stdout } = await execFileAsync(coralBin, ["sql", "--format", "json", sql], {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
    env: process.env,
  });

  return parseCoralJson(stdout);
}

export async function isCoralAvailable(): Promise<boolean> {
  try {
    const coralBin = defaultCoralBin();
    await execFileAsync(coralBin, ["--version"], { maxBuffer: 1024 * 1024 });
    return true;
  } catch {
    return false;
  }
}
