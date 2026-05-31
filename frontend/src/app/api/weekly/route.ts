import { NextResponse } from "next/server";
import { mapAppointmentInput, mapMedication, mapSymptom } from "@/lib/mappers";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildWeeklySummary } from "@/lib/weekly-builder";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    const [medRes, symRes, apptRes] = await Promise.all([
      supabase.from("medication_logs").select("*"),
      supabase.from("symptoms").select("*"),
      supabase.from("appointments").select("*"),
    ]);

    if (medRes.error) return NextResponse.json({ error: medRes.error.message }, { status: 500 });
    if (symRes.error) return NextResponse.json({ error: symRes.error.message }, { status: 500 });
    if (apptRes.error) return NextResponse.json({ error: apptRes.error.message }, { status: 500 });

    const medications = (medRes.data ?? []).map(mapMedication);
    const symptoms = (symRes.data ?? []).map(mapSymptom);
    const appointments = (apptRes.data ?? []).map(mapAppointmentInput);

    const rows = buildWeeklySummary(medications, symptoms, appointments);

    return NextResponse.json({
      rows,
      source: "Supabase care logs",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Weekly summary failed" },
      { status: 500 }
    );
  }
}
