import { NextResponse } from "next/server";
import { mapMedication, mapSymptom } from "@/lib/mappers";
import {
  fetchDailyWeather,
  getWeatherLocationLabel,
  weatherMap,
} from "@/lib/integrations/open-meteo";
import {
  buildDailyPatterns,
  buildPatternInsight,
  buildWeatherInsight,
  collectDateRange,
} from "@/lib/pattern-builder";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    const [medRes, symRes] = await Promise.all([
      supabase.from("medication_logs").select("*").order("log_date", { ascending: false }),
      supabase.from("symptoms").select("*").order("log_date", { ascending: false }),
    ]);

    if (medRes.error) return NextResponse.json({ error: medRes.error.message }, { status: 500 });
    if (symRes.error) return NextResponse.json({ error: symRes.error.message }, { status: 500 });

    const medications = (medRes.data ?? []).map(mapMedication);
    const symptoms = (symRes.data ?? []).map(mapSymptom);

    const { start, end } = collectDateRange(medications, symptoms);
    let weatherByDate: Record<string, number> = {};

    try {
      const weather = await fetchDailyWeather(start, end);
      weatherByDate = weatherMap(weather);
    } catch {
      weatherByDate = {};
    }

    const patterns = buildDailyPatterns(medications, symptoms, weatherByDate);
    const insight = buildPatternInsight(medications, symptoms);
    const weatherInsight = buildWeatherInsight(patterns);

    return NextResponse.json({
      patterns,
      insight,
      weatherInsight,
      weatherSource: "Open-Meteo",
      weatherLocation: getWeatherLocationLabel(),
      dateRange: { start, end },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
