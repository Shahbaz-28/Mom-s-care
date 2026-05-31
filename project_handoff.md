# Caregiver's Second Set of Eyes — Project Handoff

---

## What is this project?

A health dashboard for people who take care of elderly parents.

The problem it solves: caregivers track their parent's medications in one place,
doctor appointments in another, symptoms in a third app, and pharmacy refills
somewhere else. Nobody connects all of this. This project does.

It watches 6 things at once and asks: "Is there a pattern here?"

For example — it detects:
> "Mom missed her blood pressure pill 3 days in a row. The next day she had
> chest tightness rated severity 9. This same pattern happened last month too."

No app in the world tells you this today. This one does.

---

## What are the features?

**1. Alert Banner (home screen)**
- Red alert if medication was missed 2+ days in a row
- Red alert if a prescription refill is due within 5 days
- Red alert if a symptom was rated 8 or above in the last 24 hours

**2. Pattern View**
- A chart showing symptom severity over time
- Overlaid with medication taken/missed per day
- Overlaid with daily weather (temperature)
- A big insight card that says something like:
  "4 of 5 high-severity events followed 2+ missed doses in the prior week"

**3. Medication Tracker**
- Table showing each medication and whether it was taken today
- Refill due dates highlighted in orange

**4. Appointment Timeline**
- Past and upcoming doctor appointments
- Linked to what symptoms were reported around each visit

**5. Drug Warning Cross-Reference**
- Pulls real side effect data from the US FDA database
- Matches it against what symptoms Mom actually reported
- Example: "Amlodipine causes dizziness on standing — Mom reported exactly this"

**6. Weekly Summary**
- One-row-per-week: total symptoms, missed doses, appointments, average severity

---

## What data sources does it use?

| Source | What it is | Where data comes from |
|--------|------------|----------------------|
| Appointments | Doctor visit history | Local JSON file (mock of hospital system) |
| Medications | Daily pill log | Local JSONL file (caregiver fills this in) |
| Symptoms | Daily symptom log | Local JSONL file (caregiver fills this in) |
| Pharmacy | Refill due dates | Local CSV file (exported from pharmacy) |
| Weather | Daily temperature + rain | Open-Meteo API (free, live) |
| Drug Info | FDA side effects per drug | OpenFDA API (free, live) |

All 6 sources are joined together using a tool called **Coral**
which lets you query all of them with a single SQL query.

---

## API Keys needed

**ZERO. No API keys needed.**

Both APIs used are completely free with no signup required:

- **Open-Meteo** (weather): `https://api.open-meteo.com/v1/forecast` — just call it directly
- **OpenFDA** (drug info): `https://api.fda.gov/drug/label.json` — just call it directly

The only optional key is if you want to add the "Ask Claude" AI chat feature:
- **Anthropic API key** — optional, only for the AI question answering screen

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Query engine | Coral (joins all 6 sources with SQL) |
| Frontend | React + Tailwind CSS |
| Backend | Python (thin scripts) or Node.js |
| Data files | JSONL + CSV (local) |
| APIs | Open-Meteo + OpenFDA (no keys) |
| AI (optional) | Claude via Anthropic API |

---

## In one sentence

> A dashboard that connects a caregiver's medication log, symptom diary,
> pharmacy refills, doctor appointments, weather, and FDA drug data —
> and automatically detects patterns that could prevent the next ER visit.

---

*Hackathon: Pirates of the Coral-bean | Track: Personal Agent (Track 2)*
