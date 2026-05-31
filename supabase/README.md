# Supabase setup

## 1. Environment variables

Copy `frontend/.env.example` → `frontend/.env.local` and fill in:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_REF.supabase.co` (**no** `/rest/v1`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server only) |

Get keys from **Supabase → Project Settings → API**.

## 2. Create tables

1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run `supabase/schema.sql`
3. Confirm tables: `medication_logs`, `symptoms`, `appointments`, `drug_checks`

## 3. Run the app

```bash
cd frontend
npm run dev
```

Restart dev server after changing `.env.local`.

## API routes

| Method | Route | Table |
|--------|-------|-------|
| GET/POST | `/api/medications` | `medication_logs` |
| GET/POST | `/api/symptoms` | `symptoms` |
| GET/POST | `/api/appointments` | `appointments` |
| GET/POST | `/api/drug-checks` | `drug_checks` |

## Schema overview

```
medication_logs   name, dose, schedule, log_date, taken, refill_due
symptoms          log_date, name, severity (1-10), notes
appointments      appt_date, doctor, specialty, notes
drug_checks       drug, reported_symptom, fda_side_effect, match_strength
```

All tables include `id` (UUID) and `created_at`.
