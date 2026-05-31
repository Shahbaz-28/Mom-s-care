# Caregiver's Second Set of Eyes — Build Plan

Hackathon: **Pirates of the Coral-bean** · Track 2: **Personal Agent**

> Personal care agent for caregivers: Coral joins meds, symptoms, appointments, pharmacy, weather, and FDA data — then surfaces alerts and patterns.

---

## Architecture (what we’re building)

```
React UI  →  thin API (optional)  →  Coral SQL  →  6 sources
                                         ├─ appointments.json
                                         ├─ medications.jsonl
                                         ├─ symptoms.jsonl
                                         ├─ pharmacy.csv
                                         ├─ Open-Meteo API
                                         └─ OpenFDA API
```

No separate database. Coral is the query layer.

---

## Phase 1 — UI

**Goal:** The whole caregiver experience visible and clickable — screens, navigation, layouts — using **placeholder or in-memory mock JSON** only. No Coral yet.

| Task | Notes |
|------|-------|
| Scaffold app | React + Vite + Tailwind; `frontend/` folder |
| Shell | Header (“Mom’s care”), nav or tabs |
| Home + alert area | Banner component (dummy red alerts with text) |
| Pattern view | Chart area + overlay legend + insight card **(static copy)** |
| Medication tracker | Table UI; orange style for refill-due rows **(dummy rows)** |
| Appointment timeline | Vertical list + expand area for related symptoms |
| Drug cross-reference | List UI for “FDA symptom ↔ Mom reported” matches |
| Weekly summary | Table for one-row-per-week **(dummy data)** |
| UX polish | Loading/empty placeholders, readable on phone |

**Exit criteria:** Someone can demo the flow with fake data — looks like the real product story.

---

## Phase 2 — Data

**Goal:** Everything the app eventually needs exists as **structured data** and as **SQL tables inside Coral.**

| Prep | Deliverable |
|------|---------------|
| Install [Coral CLI](https://withcoral.com/docs/getting-started/installation) | `coral --version` works |
| Repo layout | `data/`, `coral/sources/` (and later `queries/`, optional `backend/`) |

| Source | Artifact | Coral |
|--------|----------|-------|
| Appointments | `data/appointments.json` mock | File/source spec → table |
| Medications | `data/medications.jsonl` mock | File/source spec → table |
| Symptoms | `data/symptoms.jsonl` mock | File/source spec → table |
| Pharmacy | `data/pharmacy.csv` mock | File/source spec → table |
| Weather | Live Open-Meteo | Custom/spec HTTP → table |
| Drug info | Live OpenFDA | Custom/spec HTTP → table |

**Mock data checklist (paint the story)**

- BP med missed **3 days** → **next day** high severity symptom
- Refill **due ≤ 5 days**
- Known drug + symptom overlap (e.g. amlodipine + dizziness) for FDA demo

**Exit criteria:**

- Coral can `SELECT` from every source  
- At least **one JOIN** succeeds (e.g. meds + symptoms on date)

---

## Phase 3 — Connect

**Goal:** **Same UI as Phase 1**, but wired to results that come **through Coral** (not hand-typed mocks).

**A — Hero queries**

Save tested SQL under `queries/` (alerts, pattern series, insight stat, meds today, appointments + symptom window, drug cross-ref, weekly rollup). Run with `coral sql "…"` until stable.

**B — Bridge**

Pick one minimal path:

- **Thin backend** — small Python or Node server: runs Coral (subprocess / export) → JSON REST `GET /api/alerts`, `GET /api/pattern`, … **or**
- **Static JSON** — pre-run Coral, drop files in `public/data/` during dev/demo (hackathon-fast)

**C — Frontend**

Replace Phase 1 placeholders with `fetch`/hooks that consume that JSON shape. Charts and tables bind to real payloads.

**Exit criteria:** Alert banner + pattern view credibly fed from Coral-backed data (static file or API — both count).

---

## Phase 4 — Final

**Goal:** Judges see a **personal agent**, not random charts.

| Task | Purpose |
|------|---------|
| Live APIs | Prefer at least OpenFDA **or** Open-Meteo in the demo path |
| Error/fallback | Slow API → graceful message |
| README | Problem · Coral sources · example `coral sql` showing a JOIN |
| Demo script (~3 min) | Home alerts → Pattern insight → FDA match |
| Copy | Pitch as **“Personal Care Agent — first mate for Mom”** |
| Optional Ask Claude | Chat over recent query results (**Anthropic** key — skip if out of time) |

**Definition of done (MVP)**

- [ ] Coral query joins **≥3 sources** in one hero demo
- [ ] Alert banner reflects real Coral logic
- [ ] Pattern view + insight card from Coral
- [ ] Medications + refill highlight from data
- [ ] README + reproducible Coral example
- [ ] Optional Claude clearly labeled optional

---

## Timeboxes (hackathon shortcuts)

| If you only have … | Advice |
|--------------------|--------|
| **48h** | Full 4-phase pass; defer optional Claude |
| **24h** | Finish Phase **1→2**, then Phase **3** for **Home + Pattern + Meds** only |
| **Stuck on Coral APIs** | File sources day 1; add OpenFDA/Meteo once tables work |

---

## Risk checklist

| Risk | Mitigation |
|------|------------|
| Coral slow Day 1 | Phase 2: files first, APIs second |
| API flake | Backend cache or static snapshot for pitching |
| UI behind | Phase 1 first so screenshots always exist |

---

## Next concrete step

1. Phase **1:** scaffold frontend + dummy nav + dummy alert + dummy chart slots  
2. Phase **2:** add `data/*` mocks + Coral `SELECT`/`JOIN`
