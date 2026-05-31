import { formatDateLabel } from "@/lib/care-utils";
import type { Medication, SymptomEntry, WeeklyRow } from "@/lib/mock-data";

interface AppointmentRecord {
  date: string;
}

function isoWeekKey(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const target = new Date(d);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${target.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function weekLabelFromDates(dates: string[]): string {
  if (dates.length === 0) return "No activity";
  const sorted = [...dates].sort();
  if (sorted[0] === sorted[sorted.length - 1]) {
    return formatDateLabel(sorted[0]);
  }
  return `${formatDateLabel(sorted[0])} – ${formatDateLabel(sorted[sorted.length - 1])}`;
}

export function buildWeeklySummary(
  medications: Medication[],
  symptoms: SymptomEntry[],
  appointments: AppointmentRecord[],
  maxWeeks = 8
): WeeklyRow[] {
  type Bucket = {
    dates: Set<string>;
    symptomCount: number;
    severitySum: number;
    missedDoses: number;
    appointments: number;
  };

  const buckets = new Map<string, Bucket>();

  function ensure(week: string): Bucket {
    let b = buckets.get(week);
    if (!b) {
      b = { dates: new Set(), symptomCount: 0, severitySum: 0, missedDoses: 0, appointments: 0 };
      buckets.set(week, b);
    }
    return b;
  }

  for (const s of symptoms) {
    const week = isoWeekKey(s.date);
    const b = ensure(week);
    b.dates.add(s.date);
    b.symptomCount += 1;
    b.severitySum += s.severity;
  }

  for (const m of medications) {
    if (m.takenToday) continue;
    const week = isoWeekKey(m.logDate);
    const b = ensure(week);
    b.dates.add(m.logDate);
    b.missedDoses += 1;
  }

  for (const a of appointments) {
    const week = isoWeekKey(a.date);
    const b = ensure(week);
    b.dates.add(a.date);
    b.appointments += 1;
  }

  return [...buckets.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, maxWeeks)
    .map(([week, b]) => ({
      week,
      weekLabel: weekLabelFromDates([...b.dates]),
      symptomCount: b.symptomCount,
      missedDoses: b.missedDoses,
      appointments: b.appointments,
      avgSeverity: b.symptomCount > 0 ? b.severitySum / b.symptomCount : 0,
    }));
}
