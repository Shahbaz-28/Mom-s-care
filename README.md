# Caregiver's Second Set of Eyes

**Track 2 — Personal Agent (Coral Hackathon)**

A caregiver dashboard that connects daily health logs, weather, and FDA drug labels. Log meds and symptoms in a simple UI; the agent spots patterns, cross-checks OpenFDA, answers questions via **Coral SQL**, and sends **Telegram alerts** when severity is high.

> *"Every pirate needs a first mate"* — one personal agent for Mom's care, powered by [Coral](https://withcoral.com).

---

## Features

| Tab | What it does |
|-----|----------------|
| **Home** | Active alerts (missed meds, refills, high severity) |
| **Ask agent** | Plain-English questions → Coral SQL → answers |
| **Patterns** | Symptom chart + meds + weather overlay |
| **Medications** | Log taken / missed doses, refill dates |
| **Visits** | Doctor appointments + nearby symptoms |
| **Drug check** | OpenFDA side-effect cross-reference |
| **Weekly** | Summary rollup (demo data) |

**Integrations:** Supabase · OpenFDA · Open-Meteo · Coral · Telegram

---

## Architecture

```
Caregiver UI (Next.js)
       ↓
   Supabase (live logs)
       ↓ export / sync
   data/*.jsonl  ←→  Coral SQL (care + open_meteo + openfda)
       ↑
   Ask agent + Telegram alerts (Next.js API routes)
```

---

## Prerequisites

- **Node.js 20+** and npm
- **Supabase** project ([free tier](https://supabase.com))
- **Coral CLI** ([install guide](https://withcoral.com/docs/getting-started/installation)) — for Ask agent + demo SQL
- **Telegram bot** (optional) — [@BotFather](https://t.me/BotFather) for high-severity alerts

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/caregiver-second-eyes.git
cd caregiver-second-eyes/frontend
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `frontend/.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://YOUR_REF.supabase.co` (no `/rest/v1`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only service role key |
| `WEATHER_LAT` / `WEATHER_LON` | No | Location for Open-Meteo (default Delhi, India) |
| `TELEGRAM_BOT_TOKEN` | No | Bot token from BotFather |
| `TELEGRAM_CHAT_ID` | No | Your numeric chat ID ([@userinfobot](https://t.me/userinfobot)) |
| `TELEGRAM_SEVERITY_THRESHOLD` | No | Alert when severity ≥ this (default `8`) |

### 3. Supabase database

1. Supabase Dashboard → **SQL Editor**
2. Run [`supabase/schema.sql`](supabase/schema.sql)
3. If `match_strength = 'none'` inserts fail, also run [`supabase/migration-match-none.sql`](supabase/migration-match-none.sql)

Details: [`supabase/README.md`](supabase/README.md)

### 4. Run the app

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Coral (Ask agent + cross-source SQL)

**Install Coral** (Windows):

```powershell
Invoke-WebRequest `
  -Uri "https://github.com/withcoral/coral/releases/latest/download/coral-x86_64-pc-windows-msvc.zip" `
  -OutFile "coral.zip"
Expand-Archive coral.zip -DestinationPath coral-bin -Force
# Add coral.exe to PATH — see withcoral.com/docs/getting-started/installation
coral --version
```

**Edit file paths** in `coral/sources/care-data.yaml` and `open-meteo.yaml` — set `location` to your clone's `data/` folder using forward slashes:

```yaml
location: "file:///C:/path/to/your/repo/data/"
```

**Add sources** (from repo root):

```powershell
cd /path/to/repo
coral source add --file coral/sources/care-data.yaml
coral source add --file coral/sources/open-meteo.yaml
coral source add --file coral/sources/openfda.yaml
coral source test care
```

Full guide: [`coral/README.md`](coral/README.md) · Demo queries: [`queries/README.md`](queries/README.md)

### 6. Telegram alerts (optional)

1. Create a bot with [@BotFather](https://t.me/BotFather) → copy token  
2. Message your bot → `/start`  
3. Get your chat ID from [@userinfobot](https://t.me/userinfobot)  
4. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to `.env.local`  
5. Restart `npm run dev`  
6. Log a symptom with **severity ≥ 8** on the Patterns tab → alert sent automatically  

---

## Demo script (60 seconds)

1. **Patterns** — log chest tightness, severity 9 → Telegram alert on phone  
2. **Drugs** — cross-check Lisinopril + dry cough (OpenFDA)  
3. **Ask agent** — *"Any symptoms rated 8 or higher?"* → shows Coral SQL + answer  
4. **Terminal** — hero join:

```powershell
coral sql "SELECT s.log_date, s.name, s.severity, w.temp_f FROM care.symptoms s LEFT JOIN open_meteo.daily_weather w ON w.date = s.log_date ORDER BY s.log_date"
```

---

## Project structure

```
med/
├── frontend/          # Next.js dashboard + API routes
├── supabase/          # schema.sql, migrations
├── coral/sources/     # Coral YAML source specs
├── data/              # Sample JSONL (Coral file sources)
├── queries/           # Hero Coral SQL for judges
├── BUILD_PLAN.md      # Build phases
└── project_handoff.md # Product spec
```

---

## API routes

| Route | Purpose |
|-------|---------|
| `GET/POST /api/medications` | Medication logs |
| `GET/POST /api/symptoms` | Symptoms (+ Telegram on severity ≥ 8) |
| `GET/POST /api/appointments` | Appointments |
| `GET/POST /api/drug-checks` | FDA cross-check queue |
| `GET /api/patterns` | Pattern chart + weather insight |
| `GET /api/openfda` | Live OpenFDA lookup |
| `POST /api/ask` | Ask agent → Coral SQL |

---

## Coral sources

| Schema | Tables | Data |
|--------|--------|------|
| `care` | medications, symptoms, appointments, drug_checks | `data/*.jsonl` |
| `open_meteo` | daily_weather | `data/weather.jsonl` |
| `openfda` | drug_labels | Live [OpenFDA API](https://open.fda.gov) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Supabase errors | URL must not include `/rest/v1`; use full service role key |
| `coral` not found | Add `%USERPROFILE%\.local\bin` to PATH |
| Coral empty care tables | Update `file:///` paths in YAML to your `data/` folder |
| Ask agent no rows | Symptom names must match data (e.g. "chest" not "dizz" if no dizziness logged) |
| No Telegram | Use **Telegram** app (not Instagram); `/start` bot; correct `TELEGRAM_CHAT_ID` |
| Paracetamol not in FDA | Use **acetaminophen** (US generic name) |

---

## License

MIT — hackathon / demo project.

---

## Acknowledgments

Built for the **Coral Personal Agent** hackathon · [Coral docs](https://withcoral.com/docs) · [OpenFDA](https://open.fda.gov) · [Open-Meteo](https://open-meteo.com)
