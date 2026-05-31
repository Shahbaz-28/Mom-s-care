import type { AskPlan } from "@/lib/ask-agent";
import { extractDrugNameFromQuestion } from "@/lib/ask-agent-utils";
import { fetchOpenFdaLabel } from "@/lib/integrations/openfda";
import { fetchDailyWeather, weatherMap } from "@/lib/integrations/open-meteo";
import { mapMedication, mapSymptom } from "@/lib/mappers";
import { collectDateRange } from "@/lib/pattern-builder";
import { createSupabaseAdmin } from "@/lib/supabase/server";

function symptomMatches(name: string, question: string): boolean {
  const q = question.toLowerCase();
  const n = name.toLowerCase();
  if (q.includes("chest tightness") || q.includes("chest pain")) {
    return n.includes("chest");
  }
  if (q.includes("dizz") || q.includes("lightheaded")) {
    return n.includes("dizz") || n.includes("light");
  }
  if (q.includes("chest") || q.includes("tightness")) return n.includes("chest");
  if (q.includes("cough")) return n.includes("cough");
  if (q.includes("breath")) return n.includes("breath");
  return true;
}

function hotThreshold(question: string): number {
  const q = question.toLowerCase();
  if (q.includes("hot") || q.includes("heat") || q.includes("warm")) return 75;
  return 0;
}

export async function runAskFallback(
  question: string,
  plan: AskPlan
): Promise<Record<string, unknown>[]> {
  const supabase = createSupabaseAdmin();

  switch (plan.intent) {
    case "symptom_missed_weather": {
      const [medRes, symRes] = await Promise.all([
        supabase.from("medication_logs").select("*"),
        supabase.from("symptoms").select("*"),
      ]);
      if (medRes.error) throw new Error(medRes.error.message);
      if (symRes.error) throw new Error(symRes.error.message);

      const medications = (medRes.data ?? []).map(mapMedication);
      const symptoms = (symRes.data ?? []).map(mapSymptom);
      const { start, end } = collectDateRange(medications, symptoms, 60);

      let weatherByDate: Record<string, number> = {};
      try {
        const weather = await fetchDailyWeather(start, end);
        weatherByDate = weatherMap(weather);
      } catch {
        weatherByDate = {};
      }

      const hot = hotThreshold(question);
      const wantsMissed = /missed|forgot|skip|not taken/i.test(question);

      const rows: Record<string, unknown>[] = [];
      for (const s of symptoms) {
        if (!symptomMatches(s.name, question)) continue;

        const missed = medications.filter(
          (m) => m.logDate === s.date && !m.takenToday
        ).length;
        const temp = weatherByDate[s.date] ?? null;

        if (wantsMissed && missed < 1) continue;
        if (hot > 0 && (temp == null || temp < hot)) continue;

        rows.push({
          log_date: s.date,
          symptom: s.name,
          severity: s.severity,
          missed_doses: missed,
          temp_f: temp,
        });
      }
      return rows.sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
    }

    case "high_severity": {
      const symRes = await supabase
        .from("symptoms")
        .select("*")
        .gte("severity", 8)
        .order("log_date", { ascending: false });
      if (symRes.error) throw new Error(symRes.error.message);
      return (symRes.data ?? []).map((row) => ({
        log_date: row.log_date,
        name: row.name,
        severity: row.severity,
        notes: row.notes,
      }));
    }

    case "missed_meds": {
      const medRes = await supabase
        .from("medication_logs")
        .select("*")
        .eq("taken", false)
        .order("log_date", { ascending: false });
      if (medRes.error) throw new Error(medRes.error.message);
      return (medRes.data ?? []).map((row) => ({
        log_date: row.log_date,
        name: row.name,
        dose: row.dose,
        schedule: row.schedule,
      }));
    }

    case "fda_lookup": {
      const drug = extractDrugNameFromQuestion(question) ?? "lisinopril";
      const text = await fetchOpenFdaLabel(drug);
      return [
        {
          generic_name: drug,
          brand_name: null,
          adverse_reactions: text.slice(0, 800),
          warnings: null,
        },
      ];
    }

    case "appointments": {
      const apptRes = await supabase
        .from("appointments")
        .select("*")
        .order("appt_date", { ascending: false });
      if (apptRes.error) throw new Error(apptRes.error.message);
      return (apptRes.data ?? []).map((row) => ({
        appt_date: row.appt_date,
        doctor: row.doctor,
        specialty: row.specialty,
        notes: row.notes,
      }));
    }

    case "drug_checks": {
      const dcRes = await supabase.from("drug_checks").select("*");
      if (dcRes.error) throw new Error(dcRes.error.message);
      return (dcRes.data ?? []).map((row) => ({
        drug: row.drug,
        reported_symptom: row.reported_symptom,
        match_strength: row.match_strength,
        fda_side_effect: row.fda_side_effect,
      }));
    }

    default: {
      const [symRes, medRes] = await Promise.all([
        supabase.from("symptoms").select("*").order("log_date", { ascending: false }).limit(10),
        supabase.from("medication_logs").select("*"),
      ]);
      if (symRes.error) throw new Error(symRes.error.message);

      const medications = (medRes.data ?? []).map(mapMedication);
      const symptoms = (symRes.data ?? []).map(mapSymptom);
      const { start, end } = collectDateRange(medications, symptoms, 30);

      let weatherByDate: Record<string, number> = {};
      try {
        const weather = await fetchDailyWeather(start, end);
        weatherByDate = weatherMap(weather);
      } catch {
        weatherByDate = {};
      }

      return symptoms.map((s) => ({
        log_date: s.date,
        symptom: s.name,
        severity: s.severity,
        temp_f: weatherByDate[s.date] ?? null,
      }));
    }
  }
}
