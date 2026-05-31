import type { Medication } from "@/lib/mock-data";

const DEFAULT_MISSED_DAYS = 2;

export function missedMedsAlertThreshold(): number {
  const n = Number(process.env.TELEGRAM_MISSED_MEDS_DAYS ?? DEFAULT_MISSED_DAYS);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_MISSED_DAYS;
}

export interface MedicationMissStreak {
  name: string;
  schedule: string;
  streak: number;
  /** Most recent missed day first */
  dates: string[];
}

export function medScheduleKey(name: string, schedule: string): string {
  return `${name.trim().toLowerCase()}|${(schedule || "Morning").trim().toLowerCase()}`;
}

export function formatMedScheduleLabel(name: string, schedule: string): string {
  return `${name.trim()} (${(schedule || "Morning").trim()})`;
}

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Per-day status per med+schedule: true = taken, false = missed, undefined = no log */
function buildDayStatus(logs: Medication[]): Map<string, Map<string, boolean>> {
  const byMed = new Map<string, Map<string, boolean>>();

  for (const log of logs) {
    const key = medScheduleKey(log.name, log.schedule);
    if (!byMed.has(key)) byMed.set(key, new Map());
    const days = byMed.get(key)!;
    if (log.takenToday) {
      days.set(log.logDate, true);
    } else if (days.get(log.logDate) !== true) {
      days.set(log.logDate, false);
    }
  }

  return byMed;
}

function uniqueMedSchedules(logs: Medication[]): { name: string; schedule: string }[] {
  const seen = new Map<string, { name: string; schedule: string }>();
  for (const log of logs) {
    const key = medScheduleKey(log.name, log.schedule);
    if (!seen.has(key)) {
      seen.set(key, {
        name: log.name.trim(),
        schedule: (log.schedule || "Morning").trim(),
      });
    }
  }
  return [...seen.values()];
}

export function consecutiveMissedStreak(
  logs: Medication[],
  drugName: string,
  schedule: string,
  throughDate: string
): MedicationMissStreak {
  const key = medScheduleKey(drugName, schedule);
  const dayStatus = buildDayStatus(logs).get(key);
  const name = drugName.trim();
  const sched = (schedule || "Morning").trim();
  const dates: string[] = [];

  if (!dayStatus) {
    return { name, schedule: sched, streak: 0, dates };
  }

  const cursor = new Date(throughDate + "T12:00:00");
  while (true) {
    const iso = isoDateLocal(cursor);
    const status = dayStatus.get(iso);
    if (status !== false) break;
    dates.push(iso);
    cursor.setDate(cursor.getDate() - 1);
  }

  return { name, schedule: sched, streak: dates.length, dates };
}

export function findMissedMedicationStreaks(
  logs: Medication[],
  minDays: number,
  throughDate?: string
): MedicationMissStreak[] {
  const end = throughDate ?? isoDateLocal(new Date());
  const streaks: MedicationMissStreak[] = [];

  for (const { name, schedule } of uniqueMedSchedules(logs)) {
    const streak = consecutiveMissedStreak(logs, name, schedule, end);
    if (streak.streak >= minDays) {
      streaks.push(streak);
    }
  }

  return streaks.sort((a, b) => b.streak - a.streak);
}

export function streakDedupeKey(streak: MedicationMissStreak): string {
  const startDate = streak.dates[streak.dates.length - 1] ?? "";
  return `missed-meds:${medScheduleKey(streak.name, streak.schedule)}:${startDate}`;
}
