import type { Alert, Appointment, Medication, SymptomEntry } from "@/lib/mock-data";
import {
  findMissedMedicationStreaks,
  formatMedScheduleLabel,
  medScheduleKey,
  missedMedsAlertThreshold,
} from "@/lib/medication-streak";

export function formatDateLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T12:00:00");
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function appointmentStatus(date: string): "upcoming" | "past" {
  return date >= todayIso() ? "upcoming" : "past";
}

export function symptomsNearAppointment(
  apptDate: string,
  symptoms: SymptomEntry[],
  windowDays = 7
): SymptomEntry[] {
  const appt = new Date(apptDate + "T12:00:00").getTime();
  const ms = windowDays * 24 * 60 * 60 * 1000;
  return symptoms.filter((s) => {
    const t = new Date(s.date + "T12:00:00").getTime();
    return Math.abs(t - appt) <= ms;
  });
}

export function buildAlerts(
  medications: Medication[],
  symptoms: SymptomEntry[]
): Alert[] {
  const alerts: Alert[] = [];
  const today = todayIso();

  const missedToday = medications.filter((m) => m.logDate === today && !m.takenToday);
  if (missedToday.length > 0) {
    const uniqueMissed = [...new Set(missedToday.map((m) => m.name.trim()))];
    alerts.push({
      id: "local-missed",
      type: "med-missed",
      severity: "critical",
      title: `${uniqueMissed.length} medication(s) missed today`,
      message: uniqueMissed.join(", ") + " not logged as taken.",
    });
  }

  const streakThreshold = missedMedsAlertThreshold();
  const missedStreaks = findMissedMedicationStreaks(medications, streakThreshold, today);
  for (const streak of missedStreaks) {
    const sorted = streak.dates.slice().sort();
    const range =
      sorted.length >= 2
        ? `${formatDateLabel(sorted[0])} – ${formatDateLabel(sorted[sorted.length - 1])}`
        : formatDateLabel(sorted[0] ?? today);

    const label = formatMedScheduleLabel(streak.name, streak.schedule);
    alerts.push({
      id: `local-missed-streak-${medScheduleKey(streak.name, streak.schedule).replace(/\|/g, "-")}`,
      type: "med-missed",
      severity: "critical",
      title: `${label} missed ${streak.streak} day(s) in a row`,
      message: `Not taken on ${range}. This pattern can precede symptom flares — check Patterns.`,
    });
  }

  const refillSoon = medications.filter((m) => m.daysUntilRefill <= 5 && m.daysUntilRefill >= 0);
  if (refillSoon.length > 0) {
    const soonestByDrug = new Map<string, { name: string; days: number }>();
    for (const m of refillSoon) {
      const key = m.name.trim().toLowerCase();
      const existing = soonestByDrug.get(key);
      if (!existing || m.daysUntilRefill < existing.days) {
        soonestByDrug.set(key, { name: m.name.trim(), days: m.daysUntilRefill });
      }
    }
    const refillParts = [...soonestByDrug.values()]
      .sort((a, b) => a.days - b.days)
      .map((r) => `${r.name} (${r.days}d)`);

    alerts.push({
      id: "local-refill",
      type: "refill-due",
      severity: "warning",
      title: `Refill due within 5 days`,
      message: refillParts.join(" · "),
    });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const cutoff = yesterday.toISOString().slice(0, 10);
  const severe = symptoms.filter((s) => s.severity >= 8 && s.date >= cutoff);
  if (severe.length > 0) {
    alerts.push({
      id: "local-symptom",
      type: "high-symptom",
      severity: "critical",
      title: "High severity symptom recently",
      message: severe.map((s) => `${s.name} (${s.severity}/10)`).join(" · "),
    });
  }

  return alerts;
}

export function buildAppointments(
  records: {
    id: string;
    date: string;
    doctor: string;
    specialty: string;
    notes?: string;
  }[],
  symptoms: SymptomEntry[]
): Appointment[] {
  return records
    .map((r) => ({
      id: r.id,
      date: r.date,
      label: formatDateLabel(r.date),
      doctor: r.doctor,
      specialty: r.specialty,
      status: appointmentStatus(r.date),
      relatedSymptoms: symptomsNearAppointment(r.date, symptoms),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function newId() {
  return crypto.randomUUID();
}
