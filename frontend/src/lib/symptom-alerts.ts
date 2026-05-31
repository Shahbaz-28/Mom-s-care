import { notifyHighSeveritySymptom } from "@/lib/integrations/telegram";
import { patientName } from "@/lib/mock-data";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function sendHighSeverityTelegramIfNeeded(payload: {
  logDate: string;
  name: string;
  severity: number;
  notes?: string | null;
}): Promise<{ sent: boolean; error?: string }> {
  let missedDosesSameDay = 0;

  try {
    const supabase = createSupabaseAdmin();
    const { count, error } = await supabase
      .from("medication_logs")
      .select("*", { count: "exact", head: true })
      .eq("log_date", payload.logDate)
      .eq("taken", false);

    if (!error && count != null) {
      missedDosesSameDay = count;
    }
  } catch {
    missedDosesSameDay = 0;
  }

  return notifyHighSeveritySymptom({
    patientName,
    logDate: payload.logDate,
    name: payload.name,
    severity: payload.severity,
    notes: payload.notes,
    missedDosesSameDay,
  });
}
