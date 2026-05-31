import {
  consecutiveMissedStreak,
  findMissedMedicationStreaks,
  formatMedScheduleLabel,
  medScheduleKey,
  missedMedsAlertThreshold,
  streakDedupeKey,
  type MedicationMissStreak,
} from "@/lib/medication-streak";
import { notifyMissedMedicationStreak } from "@/lib/integrations/telegram";
import {
  markTelegramAlertSent,
  wasTelegramAlertSent,
} from "@/lib/integrations/telegram-dedupe";
import { mapMedication } from "@/lib/mappers";
import { patientName } from "@/lib/mock-data";
import { createSupabaseAdmin } from "@/lib/supabase/server";

async function loadAllMedications() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("medication_logs")
    .select("*")
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMedication);
}

async function notifyStreakIfNew(
  streak: MedicationMissStreak
): Promise<{ sent: boolean; error?: string; drug?: string }> {
  const key = streakDedupeKey(streak);
  if (await wasTelegramAlertSent(key)) {
    return { sent: false, drug: streak.name };
  }

  const result = await notifyMissedMedicationStreak({
    patientName,
    drugName: formatMedScheduleLabel(streak.name, streak.schedule),
    streakDays: streak.streak,
    missedDates: streak.dates,
  });

  if (result.sent) {
    await markTelegramAlertSent(key);
  }

  return { ...result, drug: streak.name };
}

export async function scanMissedMedicationTelegramAlerts(options?: {
  throughDate?: string;
  drugName?: string;
  schedule?: string;
}): Promise<{ sent: boolean; error?: string; drug?: string }[]> {
  const threshold = missedMedsAlertThreshold();
  const medications = await loadAllMedications();
  const end = options?.throughDate ?? new Date().toISOString().slice(0, 10);

  let streaks = findMissedMedicationStreaks(medications, threshold, end);
  if (options?.drugName?.trim()) {
    const nameKey = options.drugName.trim().toLowerCase();
    const schedKey = (options.schedule || "Morning").trim().toLowerCase();
    streaks = streaks.filter(
      (s) =>
        s.name.trim().toLowerCase() === nameKey &&
        s.schedule.trim().toLowerCase() === schedKey
    );
  }

  const results: { sent: boolean; error?: string; drug?: string }[] = [];
  for (const streak of streaks) {
    results.push(await notifyStreakIfNew(streak));
  }
  return results;
}

export async function sendMissedMedsTelegramIfNeeded(payload: {
  name: string;
  schedule: string;
  logDate: string;
  taken: boolean;
}): Promise<{
  sent: boolean;
  error?: string;
  streak?: number;
  threshold?: number;
  reason?: string;
}> {
  const threshold = missedMedsAlertThreshold();

  if (payload.taken) {
    return { sent: false, streak: 0, threshold, reason: "logged_as_taken" };
  }

  const medications = await loadAllMedications();
  const streak = consecutiveMissedStreak(
    medications,
    payload.name,
    payload.schedule,
    payload.logDate
  );

  if (streak.streak < threshold) {
    return {
      sent: false,
      streak: streak.streak,
      threshold,
      reason:
        streak.streak === 1
          ? `need_${threshold}_consecutive_days`
          : `streak_${streak.streak}_of_${threshold}`,
    };
  }

  const results = await scanMissedMedicationTelegramAlerts({
    throughDate: payload.logDate,
    drugName: payload.name,
    schedule: payload.schedule,
  });

  const sent = results.find((r) => r.sent);
  if (sent) {
    return { sent: true, streak: streak.streak, threshold };
  }

  const failed = results.find((r) => r.error);
  return {
    ...(failed ?? { sent: false }),
    streak: streak.streak,
    threshold,
    reason: failed ? "telegram_error" : "already_sent",
  };
}
