import type { DrugMatch, Medication, SymptomEntry } from "@/lib/mock-data";
import type { AppointmentInput } from "@/components/AppointmentTimeline";

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string }).error ?? res.statusText;
}

export async function fetchMedications(): Promise<Medication[]> {
  const res = await fetch("/api/medications");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createMedication(payload: {
  name: string;
  dose: string;
  schedule: string;
  logDate: string;
  taken: boolean;
  refillDue?: string | null;
}): Promise<Medication> {
  const res = await fetch("/api/medications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchSymptoms(): Promise<(SymptomEntry & { id: string })[]> {
  const res = await fetch("/api/symptoms");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createSymptom(payload: {
  logDate: string;
  name: string;
  severity: number;
  notes?: string;
}): Promise<SymptomEntry & { id: string; telegramAlert?: { sent: boolean; error?: string } }> {
  const res = await fetch("/api/symptoms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchAppointments(): Promise<AppointmentInput[]> {
  const res = await fetch("/api/appointments");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createAppointment(payload: {
  date: string;
  doctor: string;
  specialty: string;
  notes?: string;
}): Promise<AppointmentInput> {
  const res = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchDrugChecks(): Promise<DrugMatch[]> {
  const res = await fetch("/api/drug-checks");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createDrugCheck(payload: {
  drug: string;
  reportedSymptom: string;
}): Promise<DrugMatch> {
  const res = await fetch("/api/drug-checks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchAllCareData() {
  const [medications, symptoms, appointmentRecords, drugMatches] = await Promise.all([
    fetchMedications(),
    fetchSymptoms(),
    fetchAppointments(),
    fetchDrugChecks(),
  ]);
  return { medications, symptoms, appointmentRecords, drugMatches };
}

export interface PatternResponse {
  patterns: import("@/lib/mock-data").DailyPattern[];
  insight: string;
  weatherInsight: string | null;
  weatherSource: string;
  dateRange: { start: string; end: string };
}

export async function fetchPatterns(): Promise<PatternResponse> {
  const res = await fetch("/api/patterns");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export interface AskResponse {
  answer: string;
  sql: string;
  intent: string;
  label: string;
  columns: string[];
  rows: Record<string, unknown>[];
  source: "coral" | "supabase";
  note?: string;
}

export async function askCareAgent(question: string): Promise<AskResponse> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
