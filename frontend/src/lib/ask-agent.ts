import { extractDrugNameFromQuestion } from "@/lib/ask-agent-utils";

export type AskIntent =
  | "symptom_missed_weather"
  | "high_severity"
  | "missed_meds"
  | "fda_lookup"
  | "symptoms_overview"
  | "appointments"
  | "drug_checks"
  | "unknown";

export interface AskPlan {
  intent: AskIntent;
  sql: string;
  label: string;
}

const EXAMPLE_QUESTIONS = [
  "Any symptoms rated 8 or higher?",
  "Did chest tightness happen after missed pills when it was hot?",
  "Which medications were missed recently?",
  "Show symptoms with weather on the same day",
  "What does the FDA say about lisinopril side effects?",
] as const;

export { EXAMPLE_QUESTIONS };

const SYMPTOM_ALIASES: Record<string, string[]> = {
  dizziness: ["dizz", "lightheaded", "light-headed", "vertigo"],
  chest: ["chest", "tightness", "chest pain", "chest tightness"],
  cough: ["cough", "dry cough"],
  breath: ["breath", "shortness", "shortness of breath"],
  nausea: ["nausea", "stomach", "upset"],
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

function extractSymptomFilter(question: string): string | null {
  const q = question.toLowerCase();
  let best: string | null = null;
  let bestLen = 0;
  for (const aliases of Object.values(SYMPTOM_ALIASES)) {
    for (const alias of aliases) {
      if (q.includes(alias) && alias.length > bestLen) {
        best = alias;
        bestLen = alias.length;
      }
    }
  }
  if (!best) return null;
  return `lower(s.name) LIKE '%${best.replace(/'/g, "''")}%'`;
}

function hotThreshold(question: string): number {
  const q = question.toLowerCase();
  if (includesAny(q, ["very hot", "heat wave", "scorching"])) return 85;
  if (includesAny(q, ["hot", "warm", "heat"])) return 75;
  return 0;
}

interface IntentScore {
  intent: AskIntent;
  score: number;
}

function scoreIntents(question: string): IntentScore[] {
  const q = question.toLowerCase();
  const scores: IntentScore[] = [];

  const missed = includesAny(q, ["missed", "forgot", "skip", "skipped", "not taken", "didn't take"]);
  const weather = includesAny(q, ["hot", "heat", "weather", "temp", "warm", "cold", "rain"]);
  const symptom = includesAny(q, [
    "symptom",
    "dizz",
    "cough",
    "chest",
    "pain",
    "feel",
    "felt",
    "lightheaded",
    "breath",
  ]);
  const after = includesAny(q, ["after", "before", "when", "following", "during"]);
  const severity =
    includesAny(q, ["severity", "high", "serious", "severe", "8", "9", "10"]) ||
    /\b8\s*\+|\b8\s*or\s*(higher|above|more)|rated\s*8/i.test(q);
  const fda = includesAny(q, ["fda", "side effect", "label", "warning", "reaction"]);
  const drug = extractDrugNameFromQuestion(question) !== null || includesAny(q, ["drug", "medication", "medicine", "pill"]);
  const appt = includesAny(q, ["appointment", "doctor", "visit", "specialist"]);
  const checks = includesAny(q, ["cross", "match", "drug check", "reported"]);

  if ((missed && symptom && (weather || after)) || (missed && after && symptom)) {
    scores.push({ intent: "symptom_missed_weather", score: 10 + (weather ? 3 : 0) });
  }
  if (severity) scores.push({ intent: "high_severity", score: 8 });
  if (missed && !symptom) scores.push({ intent: "missed_meds", score: 7 });
  if (fda || (drug && includesAny(q, ["fda", "side", "say", "label", "effect"]))) {
    scores.push({ intent: "fda_lookup", score: 9 });
  }
  if (symptom && weather && !missed) scores.push({ intent: "symptoms_overview", score: 6 });
  if (appt) scores.push({ intent: "appointments", score: 7 });
  if (checks) scores.push({ intent: "drug_checks", score: 6 });
  if (symptom) scores.push({ intent: "symptoms_overview", score: 4 });

  return scores.sort((a, b) => b.score - a.score);
}

function buildSymptomMissedWeatherSql(question: string): string {
  const symptomWhere = extractSymptomFilter(question);
  const hot = hotThreshold(question);
  const symptomClause = symptomWhere ? `WHERE ${symptomWhere}` : "";

  let having = "";
  if (hot > 0) {
    having = `HAVING SUM(CASE WHEN m.taken THEN 0 ELSE 1 END) >= 1 AND MAX(w.temp_f) >= ${hot}`;
  } else if (includesAny(question.toLowerCase(), ["missed", "forgot", "skip"])) {
    having = "HAVING SUM(CASE WHEN m.taken THEN 0 ELSE 1 END) >= 1";
  }

  return `
SELECT
  s.log_date,
  s.name AS symptom,
  s.severity,
  SUM(CASE WHEN m.taken THEN 0 ELSE 1 END) AS missed_doses,
  MAX(w.temp_f) AS temp_f
FROM care.symptoms s
LEFT JOIN care.medications m ON m.log_date = s.log_date
LEFT JOIN open_meteo.daily_weather w ON w.date = s.log_date
${symptomClause}
GROUP BY s.log_date, s.name, s.severity
${having}
ORDER BY s.log_date
`.trim();
}

function buildFdaSql(drug: string): string {
  const safe = drug.replace(/'/g, "''");
  return `
SELECT generic_name, brand_name, adverse_reactions, warnings
FROM openfda.drug_labels
WHERE drug_name = '${safe}'
LIMIT 1
`.trim();
}

export function planQuestion(question: string): AskPlan {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      intent: "unknown",
      sql: "SELECT log_date, name, severity FROM care.symptoms ORDER BY log_date DESC LIMIT 5",
      label: "Recent symptoms",
    };
  }

  const ranked = scoreIntents(trimmed);
  const top = ranked[0]?.intent ?? "symptoms_overview";

  switch (top) {
    case "symptom_missed_weather":
      return {
        intent: top,
        sql: buildSymptomMissedWeatherSql(trimmed),
        label: "Symptoms vs missed doses & weather",
      };
    case "high_severity":
      return {
        intent: top,
        sql: `
SELECT log_date, name, severity, notes
FROM care.symptoms
WHERE severity >= 8
ORDER BY log_date DESC
`.trim(),
        label: "High-severity symptoms (8+)",
      };
    case "missed_meds":
      return {
        intent: top,
        sql: `
SELECT log_date, name, dose, schedule
FROM care.medications
WHERE taken = false
ORDER BY log_date DESC
`.trim(),
        label: "Missed medication logs",
      };
    case "fda_lookup": {
      const drug = extractDrugNameFromQuestion(trimmed) ?? "lisinopril";
      return {
        intent: top,
        sql: buildFdaSql(drug),
        label: `FDA label for ${drug}`,
      };
    }
    case "appointments":
      return {
        intent: top,
        sql: `
SELECT appt_date, doctor, specialty, notes
FROM care.appointments
ORDER BY appt_date DESC
`.trim(),
        label: "Appointments",
      };
    case "drug_checks":
      return {
        intent: top,
        sql: `
SELECT drug, reported_symptom, match_strength, fda_side_effect
FROM care.drug_checks
ORDER BY drug
`.trim(),
        label: "Saved drug cross-checks",
      };
    case "symptoms_overview":
    default:
      return {
        intent: "symptoms_overview",
        sql: `
SELECT s.log_date, s.name AS symptom, s.severity, w.temp_f
FROM care.symptoms s
LEFT JOIN open_meteo.daily_weather w ON w.date = s.log_date
ORDER BY s.log_date DESC
LIMIT 10
`.trim(),
        label: "Symptoms with daily weather",
      };
  }
}

export function synthesizeAnswer(
  question: string,
  plan: AskPlan,
  rows: Record<string, unknown>[]
): string {
  if (rows.length === 0) {
    return `I searched your care logs (${plan.label.toLowerCase()}) but didn't find matching records for that question. Try logging more symptoms or meds, or rephrase with words like "missed pills", "hot weather", or a drug name.`;
  }

  switch (plan.intent) {
    case "symptom_missed_weather": {
      const lines = rows.map((r) => {
        const date = String(r.log_date ?? "unknown date");
        const symptom = String(r.symptom ?? r.name ?? "symptom");
        const severity = r.severity ?? "?";
        const missed = Number(r.missed_doses ?? 0);
        const temp = r.temp_f != null ? `${r.temp_f}°F` : "no weather data";
        return `On ${date}, ${symptom} (severity ${severity}) coincided with ${missed} missed dose log(s) and ${temp}.`;
      });
      const hot = hotThreshold(question);
      const intro =
        hot > 0
          ? `Yes — I found ${rows.length} day(s) where symptoms overlapped with missed doses on warmer days (≥${hot}°F):`
          : `I found ${rows.length} day(s) where symptoms overlapped with missed medication logs:`;
      return `${intro}\n\n${lines.join("\n")}`;
    }
    case "high_severity": {
      const lines = rows.map(
        (r) =>
          `${r.log_date}: ${r.name} rated ${r.severity}/10${r.notes ? ` (${r.notes})` : ""}`
      );
      return `There ${rows.length === 1 ? "is" : "are"} ${rows.length} high-severity symptom log(s):\n\n${lines.join("\n")}`;
    }
    case "missed_meds": {
      const lines = rows.map(
        (r) => `${r.log_date}: ${r.name} (${r.dose}) — scheduled ${r.schedule}`
      );
      return `Missed or not-taken medication logs:\n\n${lines.join("\n")}`;
    }
    case "fda_lookup": {
      const row = rows[0];
      const generic = row.generic_name ?? "unknown";
      const brand = row.brand_name ?? "n/a";
      const reactions = String(row.adverse_reactions ?? "").slice(0, 400);
      return `FDA label for ${generic} (${brand}):\n\nAdverse reactions excerpt:\n${reactions || "No adverse reactions text returned."}${reactions.length >= 400 ? "…" : ""}`;
    }
    case "appointments": {
      const lines = rows.map(
        (r) => `${r.appt_date}: ${r.doctor} (${r.specialty})${r.notes ? ` — ${r.notes}` : ""}`
      );
      return `Appointment timeline:\n\n${lines.join("\n")}`;
    }
    case "drug_checks": {
      const lines = rows.map(
        (r) =>
          `${r.drug}: reported "${r.reported_symptom}" → FDA match ${r.match_strength}${r.fda_side_effect ? ` (${r.fda_side_effect})` : ""}`
      );
      return `Saved drug cross-checks:\n\n${lines.join("\n")}`;
    }
    default: {
      const lines = rows.slice(0, 5).map((r) => {
        const temp = r.temp_f != null ? `, ${r.temp_f}°F` : "";
        return `${r.log_date}: ${r.symptom ?? r.name} (severity ${r.severity}${temp})`;
      });
      return `Recent symptom logs with weather:\n\n${lines.join("\n")}${rows.length > 5 ? `\n\n…and ${rows.length - 5} more row(s).` : ""}`;
    }
  }
}

export function fallbackHint(): string {
  return "Coral CLI was unavailable — answered from Supabase instead. Install Coral locally for cross-source SQL joins.";
}
