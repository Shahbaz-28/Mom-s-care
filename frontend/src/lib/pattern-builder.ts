import type { DailyPattern, Medication, SymptomEntry } from "@/lib/mock-data";
import { formatDateLabel, todayIso } from "@/lib/care-utils";
import { DEFAULT_WEATHER } from "@/lib/integrations/open-meteo";

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function collectDateRange(
  medications: Medication[],
  symptoms: SymptomEntry[],
  windowDays = 14
): { start: string; end: string; dates: string[] } {
  const end = todayIso();
  const start = addDays(end, -(windowDays - 1));

  const allDates = new Set<string>();
  for (let i = 0; i < windowDays; i++) {
    allDates.add(addDays(end, -i));
  }
  medications.forEach((m) => allDates.add(m.logDate));
  symptoms.forEach((s) => allDates.add(s.date));

  const dates = [...allDates]
    .filter((d) => d >= start && d <= end)
    .sort();

  return {
    start: dates[0] ?? start,
    end: dates[dates.length - 1] ?? end,
    dates: dates.length ? dates : [end],
  };
}

export function buildDailyPatterns(
  medications: Medication[],
  symptoms: SymptomEntry[],
  weatherByDate: Record<string, number>
): DailyPattern[] {
  const { dates } = collectDateRange(medications, symptoms);

  return dates.map((date) => {
    const dayMeds = medications.filter((m) => m.logDate === date);
    const daySymptoms = symptoms.filter((s) => s.date === date);
    const top = [...daySymptoms].sort((a, b) => b.severity - a.severity)[0];

    return {
      date,
      label: formatDateLabel(date),
      symptomSeverity: top?.severity ?? null,
      symptomName: top?.name ?? null,
      medsTaken: dayMeds.filter((m) => m.takenToday).length,
      medsTotal: dayMeds.length,
      tempF: weatherByDate[date] ?? DEFAULT_WEATHER.fallbackTempF,
    };
  });
}

export function buildPatternInsight(
  medications: Medication[],
  symptoms: SymptomEntry[]
): string {
  const highEvents = symptoms.filter((s) => s.severity >= 8);
  if (highEvents.length === 0) {
    return "Log symptoms with severity 8+ to detect patterns with missed doses.";
  }

  let followed = 0;
  for (const event of highEvents) {
    const windowStart = addDays(event.date, -7);
    const missedInWeek = medications.filter(
      (m) => m.logDate >= windowStart && m.logDate <= event.date && !m.takenToday
    ).length;
    if (missedInWeek >= 2) followed++;
  }

  return `${followed} of ${highEvents.length} high-severity events followed 2+ missed doses in the prior week.`;
}

export function buildWeatherInsight(
  patterns: DailyPattern[]
): string | null {
  const withSymptoms = patterns.filter((p) => (p.symptomSeverity ?? 0) >= 6);
  if (withSymptoms.length === 0) return null;

  const hotDays = withSymptoms.filter((p) => p.tempF >= 80);
  if (hotDays.length >= 2) {
    return `${hotDays.length} high-severity symptom day(s) occurred when daily high was 80°F+ (Open-Meteo). Consider hydration and staying cool.`;
  }
  return null;
}

export { collectDateRange };
