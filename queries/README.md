# Coral SQL queries — Caregiver's Second Set of Eyes

Run from project root after adding sources (see `coral/README.md`).

## Hero demo queries

### 1. Pattern join — symptoms + meds + weather (3 sources)

```sql
SELECT
  s.log_date,
  s.name AS symptom,
  s.severity,
  COUNT(m.name) AS med_logs,
  SUM(CASE WHEN m.taken THEN 0 ELSE 1 END) AS missed_doses,
  w.temp_f
FROM care.symptoms s
LEFT JOIN care.medications m ON m.log_date = s.log_date
LEFT JOIN open_meteo.daily_weather w ON w.date = s.log_date
GROUP BY s.log_date, s.name, s.severity, w.temp_f
ORDER BY s.log_date;
```

### 2. High severity symptoms (alert logic)

```sql
SELECT log_date, name, severity
FROM care.symptoms
WHERE severity >= 8
ORDER BY log_date DESC;
```

### 3. Missed medications by day

```sql
SELECT log_date, name, dose
FROM care.medications
WHERE taken = false
ORDER BY log_date DESC;
```

### 4. FDA label lookup (live OpenFDA)

```sql
SELECT generic_name, brand_name, adverse_reactions
FROM openfda.drug_labels
WHERE drug_name = 'lisinopril'
LIMIT 1;
```

### 5. Drug check + FDA (4 sources)

```sql
SELECT
  d.drug,
  d.reported_symptom,
  d.match_strength,
  f.adverse_reactions
FROM care.drug_checks d
CROSS JOIN openfda.drug_labels f
WHERE f.drug_name = lower(d.drug)
LIMIT 5;
```

## CLI

```powershell
cd path/to/your/repo
coral sql "SELECT * FROM care.symptoms LIMIT 5"
```

Or save a query to a file and paste into `coral sql "..."`.
