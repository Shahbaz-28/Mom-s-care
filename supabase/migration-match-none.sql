-- Run once if drug_checks already exists (allows "none" match strength)
ALTER TABLE drug_checks DROP CONSTRAINT IF EXISTS drug_checks_match_strength_check;
ALTER TABLE drug_checks ADD CONSTRAINT drug_checks_match_strength_check
  CHECK (match_strength IN ('exact', 'likely', 'none'));
