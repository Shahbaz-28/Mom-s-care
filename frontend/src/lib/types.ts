export type AlertType = "med-missed" | "refill-due" | "high-symptom";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: "critical" | "warning";
}

export interface DailyPattern {
  date: string;
  label: string;
  symptomSeverity: number | null;
  symptomName: string | null;
  medsTaken: number;
  medsTotal: number;
  tempF: number;
}

export interface MedicationLog {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  logDate: string;
  taken: boolean;
  refillDue: string | null;
  createdAt: string;
}

export interface SymptomRecord {
  id: string;
  logDate: string;
  name: string;
  severity: number;
  notes: string | null;
  createdAt: string;
}

export interface AppointmentRecord {
  id: string;
  apptDate: string;
  doctor: string;
  specialty: string;
  notes: string | null;
  createdAt: string;
}

export interface SymptomEntry {
  date: string;
  name: string;
  severity: number;
  notes?: string;
}

export interface Appointment {
  id: string;
  date: string;
  label: string;
  doctor: string;
  specialty: string;
  status: "upcoming" | "past";
  relatedSymptoms: SymptomEntry[];
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  takenToday: boolean;
  refillDue: string;
  daysUntilRefill: number;
  logDate: string;
}

export interface DrugMatch {
  id: string;
  drug: string;
  fdaSideEffect: string;
  reportedSymptom: string;
  lastReported: string;
  matchStrength: "exact" | "likely";
}

export interface WeeklyRow {
  week: string;
  weekLabel: string;
  symptomCount: number;
  missedDoses: number;
  appointments: number;
  avgSeverity: number;
}

export interface HomeSummary {
  alerts: Alert[];
  cards: {
    tab: string;
    title: string;
    stat: string;
    desc: string;
    color: string;
  }[];
  patternInsight: string;
}

export const patientName = "Mom";

export const navItems = [
  { id: "home", label: "Home", short: "Home" },
  { id: "pattern", label: "Patterns", short: "Pattern" },
  { id: "meds", label: "Medications", short: "Meds" },
  { id: "visits", label: "Visits", short: "Visits" },
  { id: "drugs", label: "Drug check", short: "Drugs" },
  { id: "weekly", label: "Weekly", short: "Weekly" },
] as const;

export type TabId = (typeof navItems)[number]["id"];
