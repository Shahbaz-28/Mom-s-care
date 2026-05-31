export interface MedicationLogRow {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  log_date: string;
  taken: boolean;
  refill_due: string | null;
  created_at: string;
}

export interface SymptomRow {
  id: string;
  log_date: string;
  name: string;
  severity: number;
  notes: string | null;
  created_at: string;
}

export interface AppointmentRow {
  id: string;
  appt_date: string;
  doctor: string;
  specialty: string;
  notes: string | null;
  created_at: string;
}

export interface DrugCheckRow {
  id: string;
  drug: string;
  reported_symptom: string;
  fda_side_effect: string;
  match_strength: "exact" | "likely" | "none";
  created_at: string;
}
