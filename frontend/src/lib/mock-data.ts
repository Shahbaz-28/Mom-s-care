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

export interface Medication {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  logDate: string;
  takenToday: boolean;
  refillDue: string;
  daysUntilRefill: number;
}

export interface SymptomEntry {
  id?: string;
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

export interface DrugMatch {
  id: string;
  drug: string;
  fdaSideEffect: string;
  reportedSymptom: string;
  lastReported: string;
  matchStrength: "exact" | "likely" | "none";
}

export interface WeeklyRow {
  week: string;
  weekLabel: string;
  symptomCount: number;
  missedDoses: number;
  appointments: number;
  avgSeverity: number;
}

export const patientName = "Mom";

export const alerts: Alert[] = [
  {
    id: "a1",
    type: "med-missed",
    severity: "critical",
    title: "Medication missed 3 days in a row",
    message:
      "Lisinopril (blood pressure) was not logged for May 22–24. This pattern preceded chest tightness last month.",
  },
  {
    id: "a2",
    type: "refill-due",
    severity: "warning",
    title: "Refill due in 3 days",
    message: "Amlodipine 5mg runs out May 30. Pharmacy: CVS Main St.",
  },
  {
    id: "a3",
    type: "high-symptom",
    severity: "critical",
    title: "High severity symptom in last 24 hours",
    message: "Chest tightness rated 9/10 on May 25 morning. Consider calling her cardiologist.",
  },
];

export const patternInsight =
  "4 of 5 high-severity events followed 2+ missed doses in the prior week.";

export const dailyPatterns: DailyPattern[] = [
  { date: "2026-05-19", label: "May 19", symptomSeverity: 2, symptomName: "Mild fatigue", medsTaken: 4, medsTotal: 4, tempF: 68 },
  { date: "2026-05-20", label: "May 20", symptomSeverity: 3, symptomName: "Dizziness", medsTaken: 4, medsTotal: 4, tempF: 71 },
  { date: "2026-05-21", label: "May 21", symptomSeverity: 4, symptomName: "Headache", medsTaken: 3, medsTotal: 4, tempF: 74 },
  { date: "2026-05-22", label: "May 22", symptomSeverity: 5, symptomName: "Dizziness", medsTaken: 2, medsTotal: 4, tempF: 76 },
  { date: "2026-05-23", label: "May 23", symptomSeverity: 6, symptomName: "Lightheaded", medsTaken: 1, medsTotal: 4, tempF: 78 },
  { date: "2026-05-24", label: "May 24", symptomSeverity: 7, symptomName: "Shortness of breath", medsTaken: 0, medsTotal: 4, tempF: 80 },
  { date: "2026-05-25", label: "May 25", symptomSeverity: 9, symptomName: "Chest tightness", medsTaken: 2, medsTotal: 4, tempF: 82 },
  { date: "2026-05-26", label: "May 26", symptomSeverity: 5, symptomName: "Fatigue", medsTaken: 4, medsTotal: 4, tempF: 75 },
  { date: "2026-05-27", label: "May 27", symptomSeverity: 3, symptomName: "Mild dizziness", medsTaken: 3, medsTotal: 4, tempF: 72 },
];

export const medications: Medication[] = [
  {
    id: "m1",
    name: "Lisinopril",
    dose: "10 mg",
    schedule: "Morning",
    logDate: "2026-05-27",
    takenToday: false,
    refillDue: "2026-06-12",
    daysUntilRefill: 16,
  },
  {
    id: "m2",
    name: "Amlodipine",
    dose: "5 mg",
    schedule: "Morning",
    logDate: "2026-05-27",
    takenToday: true,
    refillDue: "2026-05-30",
    daysUntilRefill: 3,
  },
  {
    id: "m3",
    name: "Metformin",
    dose: "500 mg",
    schedule: "With dinner",
    logDate: "2026-05-27",
    takenToday: true,
    refillDue: "2026-06-18",
    daysUntilRefill: 22,
  },
  {
    id: "m4",
    name: "Atorvastatin",
    dose: "20 mg",
    schedule: "Bedtime",
    logDate: "2026-05-27",
    takenToday: true,
    refillDue: "2026-07-01",
    daysUntilRefill: 35,
  },
];

export const appointments: Appointment[] = [
  {
    id: "ap1",
    date: "2026-06-03",
    label: "Jun 3",
    doctor: "Dr. Patel",
    specialty: "Cardiology follow-up",
    status: "upcoming",
    relatedSymptoms: [
      { date: "2026-05-25", name: "Chest tightness", severity: 9 },
      { date: "2026-05-24", name: "Shortness of breath", severity: 7 },
      { date: "2026-05-23", name: "Lightheaded", severity: 6 },
    ],
  },
  {
    id: "ap2",
    date: "2026-05-08",
    label: "May 8",
    doctor: "Dr. Chen",
    specialty: "Primary care",
    status: "past",
    relatedSymptoms: [
      { date: "2026-05-07", name: "Dizziness on standing", severity: 8 },
      { date: "2026-05-06", name: "Swollen ankles", severity: 4 },
      { date: "2026-05-05", name: "Headache", severity: 5 },
    ],
  },
  {
    id: "ap3",
    date: "2026-04-15",
    label: "Apr 15",
    doctor: "Dr. Patel",
    specialty: "Cardiology",
    status: "past",
    relatedSymptoms: [
      { date: "2026-04-14", name: "Chest tightness", severity: 8 },
      { date: "2026-04-13", name: "Fatigue", severity: 6 },
    ],
  },
];

export const drugMatches: DrugMatch[] = [
  {
    id: "d1",
    drug: "Amlodipine",
    fdaSideEffect: "Dizziness, especially when standing up",
    reportedSymptom: "Dizziness on standing (severity 8)",
    lastReported: "May 20",
    matchStrength: "exact",
  },
  {
    id: "d2",
    drug: "Amlodipine",
    fdaSideEffect: "Peripheral edema (ankle swelling)",
    reportedSymptom: "Swollen ankles (severity 4)",
    lastReported: "May 6",
    matchStrength: "likely",
  },
  {
    id: "d3",
    drug: "Lisinopril",
    fdaSideEffect: "Dry cough",
    reportedSymptom: "Persistent cough (severity 5)",
    lastReported: "Apr 28",
    matchStrength: "likely",
  },
  {
    id: "d4",
    drug: "Metformin",
    fdaSideEffect: "Nausea",
    reportedSymptom: "Upset stomach after dinner (severity 3)",
    lastReported: "May 12",
    matchStrength: "likely",
  },
];

export const weeklySummary: WeeklyRow[] = [
  { week: "2026-W18", weekLabel: "Apr 28 – May 4", symptomCount: 6, missedDoses: 2, appointments: 0, avgSeverity: 4.2 },
  { week: "2026-W19", weekLabel: "May 5 – May 11", symptomCount: 8, missedDoses: 4, appointments: 1, avgSeverity: 5.8 },
  { week: "2026-W20", weekLabel: "May 12 – May 18", symptomCount: 5, missedDoses: 1, appointments: 0, avgSeverity: 3.6 },
  { week: "2026-W21", weekLabel: "May 19 – May 25", symptomCount: 9, missedDoses: 7, appointments: 0, avgSeverity: 6.4 },
  { week: "2026-W22", weekLabel: "May 26 – Jun 1 (partial)", symptomCount: 2, missedDoses: 1, appointments: 1, avgSeverity: 4.0 },
];

export const navItems = [
  { id: "home", label: "Home", short: "Home" },
  { id: "ask", label: "Ask agent", short: "Ask" },
  { id: "pattern", label: "Patterns", short: "Pattern" },
  { id: "meds", label: "Medications", short: "Meds" },
  { id: "visits", label: "Visits", short: "Visits" },
  { id: "drugs", label: "Drug check", short: "Drugs" },
  { id: "weekly", label: "Weekly", short: "Weekly" },
] as const;

export type TabId = (typeof navItems)[number]["id"];
