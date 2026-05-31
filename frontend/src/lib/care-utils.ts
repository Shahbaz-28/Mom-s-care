import type { Alert, Appointment, Medication, SymptomEntry } from "@/lib/mock-data";

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
    alerts.push({
      id: "local-missed",
      type: "med-missed",
      severity: "critical",
      title: `${missedToday.length} medication(s) missed today`,
      message: missedToday.map((m) => m.name).join(", ") + " not logged as taken.",
    });
  }

  const refillSoon = medications.filter((m) => m.daysUntilRefill <= 5 && m.daysUntilRefill >= 0);
  if (refillSoon.length > 0) {
    alerts.push({
      id: "local-refill",
      type: "refill-due",
      severity: "warning",
      title: `Refill due within 5 days`,
      message: refillSoon.map((m) => `${m.name} (${m.daysUntilRefill}d)`).join(" · "),
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
