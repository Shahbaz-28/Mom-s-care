import { daysUntil, formatDateLabel } from "@/lib/care-utils";
import type { DrugMatch, Medication, SymptomEntry } from "@/lib/mock-data";
import type {
  AppointmentRow,
  DrugCheckRow,
  MedicationLogRow,
  SymptomRow,
} from "@/lib/supabase/types";
import type { AppointmentInput } from "@/components/AppointmentTimeline";

export function mapMedication(row: MedicationLogRow): Medication {
  const refillDue = row.refill_due ?? row.log_date;
  return {
    id: row.id,
    name: row.name,
    dose: row.dose,
    schedule: row.schedule,
    logDate: row.log_date,
    takenToday: row.taken,
    refillDue,
    daysUntilRefill: daysUntil(refillDue),
  };
}

export function mapSymptom(row: SymptomRow): SymptomEntry & { id: string } {
  return {
    id: row.id,
    date: row.log_date,
    name: row.name,
    severity: row.severity,
    notes: row.notes ?? undefined,
  };
}

export function mapAppointmentInput(row: AppointmentRow): AppointmentInput {
  return {
    id: row.id,
    date: row.appt_date,
    doctor: row.doctor,
    specialty: row.specialty,
    notes: row.notes ?? undefined,
  };
}

export function mapDrugCheck(row: DrugCheckRow): DrugMatch {
  const created = new Date(row.created_at);
  return {
    id: row.id,
    drug: row.drug,
    fdaSideEffect: row.fda_side_effect,
    reportedSymptom: row.reported_symptom,
    lastReported: formatDateLabel(
      `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`
    ),
    matchStrength: row.match_strength,
  };
}
