-- Caregiver's Second Set of Eyes — Supabase schema
-- Run in Supabase Dashboard → SQL Editor → New query → Run

-- Medication daily logs (caregiver input)
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT 'Morning',
  log_date DATE NOT NULL,
  taken BOOLEAN NOT NULL DEFAULT true,
  refill_due DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_log_date ON medication_logs (log_date DESC);

-- Symptom diary
CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL,
  name TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptoms_log_date ON symptoms (log_date DESC);

-- Doctor appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appt_date DATE NOT NULL,
  doctor TEXT NOT NULL,
  specialty TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_appt_date ON appointments (appt_date DESC);

-- Medications queued for FDA cross-reference
CREATE TABLE IF NOT EXISTS drug_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug TEXT NOT NULL,
  reported_symptom TEXT NOT NULL,
  fda_side_effect TEXT NOT NULL DEFAULT 'Pending OpenFDA match',
  match_strength TEXT NOT NULL DEFAULT 'likely' CHECK (match_strength IN ('exact', 'likely', 'none')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_checks_created_at ON drug_checks (created_at DESC);

-- Hackathon demo: server API uses service role (bypasses RLS).
-- Optional: enable RLS later when you add Supabase Auth per caregiver.
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_checks ENABLE ROW LEVEL SECURITY;

-- Demo seed (optional — remove if you want empty tables)
INSERT INTO medication_logs (name, dose, schedule, log_date, taken, refill_due) VALUES
  ('Lisinopril', '10 mg', 'Morning', CURRENT_DATE, false, CURRENT_DATE + 16),
  ('Amlodipine', '5 mg', 'Morning', CURRENT_DATE, true, CURRENT_DATE + 3),
  ('Metformin', '500 mg', 'With dinner', CURRENT_DATE, true, CURRENT_DATE + 22);

INSERT INTO symptoms (log_date, name, severity, notes) VALUES
  (CURRENT_DATE - 2, 'Chest tightness', 9, 'Morning, after missed BP meds'),
  (CURRENT_DATE - 3, 'Shortness of breath', 7, NULL),
  (CURRENT_DATE - 4, 'Lightheaded', 6, NULL);

INSERT INTO appointments (appt_date, doctor, specialty, notes) VALUES
  (CURRENT_DATE + 3, 'Dr. Patel', 'Cardiology follow-up', 'Discuss recent chest symptoms'),
  (CURRENT_DATE - 23, 'Dr. Chen', 'Primary care', NULL);

INSERT INTO drug_checks (drug, reported_symptom, fda_side_effect, match_strength) VALUES
  ('Amlodipine', 'Dizziness on standing (severity 8)', 'Dizziness, especially when standing up', 'exact');
