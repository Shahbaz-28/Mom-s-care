import { NextResponse } from "next/server";
import { mapMedication } from "@/lib/mappers";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("medication_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(mapMedication));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, dose, schedule, logDate, taken, refillDue } = body;

    if (!name?.trim() || !dose?.trim() || !logDate) {
      return NextResponse.json({ error: "name, dose, and logDate are required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("medication_logs")
      .insert({
        name: name.trim(),
        dose: dose.trim(),
        schedule: schedule?.trim() || "Morning",
        log_date: logDate,
        taken: Boolean(taken),
        refill_due: refillDue || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapMedication(data), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
