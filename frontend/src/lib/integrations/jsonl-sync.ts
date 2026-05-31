import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  fetchDailyWeather,
  getWeatherCoordinates,
} from "@/lib/integrations/open-meteo";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { todayIso } from "@/lib/care-utils";

function dataDir(): string {
  return process.env.CARE_JSONL_DIR ?? path.join(process.cwd(), "..", "data");
}

function toJsonlLine(record: Record<string, unknown>): string {
  return JSON.stringify(record);
}

function dateRangeFromRows(dates: string[]): { start: string; end: string } {
  const end = todayIso();
  if (dates.length === 0) {
    const d = new Date(end + "T12:00:00");
    d.setDate(d.getDate() - 30);
    return { start: d.toISOString().slice(0, 10), end };
  }
  const sorted = [...dates].sort();
  return { start: sorted[0], end: sorted[sorted.length - 1] > end ? sorted[sorted.length - 1] : end };
}

export async function syncCareDataToJsonl(): Promise<void> {
  const supabase = createSupabaseAdmin();
  const dir = dataDir();
  await mkdir(dir, { recursive: true });

  const [medRes, symRes, apptRes, dcRes] = await Promise.all([
    supabase.from("medication_logs").select("*").order("log_date", { ascending: true }),
    supabase.from("symptoms").select("*").order("log_date", { ascending: true }),
    supabase.from("appointments").select("*").order("appt_date", { ascending: true }),
    supabase.from("drug_checks").select("*").order("created_at", { ascending: true }),
  ]);

  if (medRes.error) throw new Error(medRes.error.message);
  if (symRes.error) throw new Error(symRes.error.message);
  if (apptRes.error) throw new Error(apptRes.error.message);
  if (dcRes.error) throw new Error(dcRes.error.message);

  const medLines = (medRes.data ?? []).map((row) =>
    toJsonlLine({
      name: row.name,
      dose: row.dose,
      schedule: row.schedule,
      log_date: row.log_date,
      taken: row.taken,
      refill_due: row.refill_due,
    })
  );

  const symLines = (symRes.data ?? []).map((row) =>
    toJsonlLine({
      log_date: row.log_date,
      name: row.name,
      severity: row.severity,
      notes: row.notes,
    })
  );

  const apptLines = (apptRes.data ?? []).map((row) =>
    toJsonlLine({
      appt_date: row.appt_date,
      doctor: row.doctor,
      specialty: row.specialty,
      notes: row.notes,
    })
  );

  const dcLines = (dcRes.data ?? []).map((row) =>
    toJsonlLine({
      drug: row.drug,
      reported_symptom: row.reported_symptom,
      fda_side_effect: row.fda_side_effect,
      match_strength: row.match_strength,
    })
  );

  const allDates = [
    ...(medRes.data ?? []).map((r) => r.log_date),
    ...(symRes.data ?? []).map((r) => r.log_date),
  ];
  const { start, end } = dateRangeFromRows(allDates);

  const { lat, lon } = getWeatherCoordinates();
  let weatherLines: string[] = [];
  try {
    const weather = await fetchDailyWeather(start, end);
    weatherLines = weather.map((w) =>
      toJsonlLine({
        date: w.date,
        temp_f: w.tempF,
        latitude: lat,
        longitude: lon,
      })
    );
  } catch {
    weatherLines = [];
  }

  await Promise.all([
    writeFile(path.join(dir, "medications.jsonl"), medLines.join("\n") + (medLines.length ? "\n" : "")),
    writeFile(path.join(dir, "symptoms.jsonl"), symLines.join("\n") + (symLines.length ? "\n" : "")),
    writeFile(path.join(dir, "appointments.jsonl"), apptLines.join("\n") + (apptLines.length ? "\n" : "")),
    writeFile(path.join(dir, "drug_checks.jsonl"), dcLines.join("\n") + (dcLines.length ? "\n" : "")),
    writeFile(
      path.join(dir, "weather.jsonl"),
      weatherLines.join("\n") + (weatherLines.length ? "\n" : "")
    ),
  ]);
}

/** Fire-and-forget sync so API responses stay fast. */
export function scheduleCareJsonlSync(): void {
  syncCareDataToJsonl().catch((err) => {
    console.error("[jsonl-sync]", err instanceof Error ? err.message : err);
  });
}
