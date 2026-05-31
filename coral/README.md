# Coral setup — Caregiver's Second Set of Eyes

Three sources for the hackathon demo (join caregiver logs + weather + FDA).

| Source | File | Type |
|--------|------|------|
| **care** | `coral/sources/care-data.yaml` | Local JSONL (Supabase export) |
| **open_meteo** | `coral/sources/open-meteo.yaml` | Local `data/weather.jsonl` |
| **openfda** | `coral/sources/openfda.yaml` | Live OpenFDA API |

Sample data lives in `data/*.jsonl`. Replace with Supabase exports as caregivers log more.

---

## 1. Fix data path (if needed)

Each machine needs an absolute `file:///` URI to this repo's `data/` folder.

**Example (Windows):**

```yaml
location: "file:///C:/Users/you/projects/caregiver-second-eyes/data/"
```

**Example (macOS/Linux):**

```yaml
location: "file:///home/you/projects/caregiver-second-eyes/data/"
```

Edit `location` in:

- `coral/sources/care-data.yaml` (all four tables)
- `coral/sources/open-meteo.yaml`

Use **forward slashes** only. Then re-add sources if you already added them with wrong paths.

---

## 2. Lint specs

```powershell
cd path\to\your\repo
coral source lint coral\sources\care-data.yaml
coral source lint coral\sources\open-meteo.yaml
coral source lint coral\sources\openfda.yaml
```

---

## 3. Add all sources

```powershell
cd path\to\your\repo
coral source add --file coral\sources\care-data.yaml
coral source add --file coral\sources\open-meteo.yaml
coral source add --file coral\sources\openfda.yaml
```

---

## 4. Test each source

```powershell
coral source test care
coral source test open_meteo
coral source test openfda
```

---

## 5. List tables

```powershell
coral sql "SELECT schema_name, table_name FROM coral.tables WHERE schema_name IN ('care','open_meteo','openfda') ORDER BY 1, 2"
```

Expected tables:

- `care.medications`, `care.symptoms`, `care.appointments`, `care.drug_checks`
- `open_meteo.daily_weather`
- `openfda.drug_labels`

---

## 6. Run hero join (demo for judges)

```powershell
coral sql "SELECT s.log_date, s.name, s.severity, w.temp_f FROM care.symptoms s LEFT JOIN open_meteo.daily_weather w ON w.date = s.log_date ORDER BY s.log_date"
```

More queries: see `queries/README.md`.

---

## 7. Keep files in sync with Supabase

When caregivers add data in the app, re-export tables from Supabase → overwrite `data/*.jsonl`, then re-run Coral queries.

Optional: use Supabase Dashboard → Table → Export CSV → convert to JSONL.

---

## OpenFDA notes

- Use **US generic names**: `acetaminophen` not `paracetamol`, `lisinopril`, `amlodipine`.
- Query with filter:

```sql
SELECT * FROM openfda.drug_labels WHERE drug_name = 'lisinopril' LIMIT 1
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Empty care tables | Check `CARE_DATA_PATH` points to folder with JSONL files |
| openfda test fails | Drug name spelling; try `amlodipine` |
| Path errors on Windows | Use `file:///C:/Users/...` not backslashes |

Docs: [Coral custom sources](https://withcoral.com/docs/guides/write-a-custom-source)
