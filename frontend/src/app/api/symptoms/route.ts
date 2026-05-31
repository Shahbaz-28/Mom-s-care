import { NextResponse } from "next/server";
import { mapSymptom } from "@/lib/mappers";
import { sendHighSeverityTelegramIfNeeded } from "@/lib/symptom-alerts";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("symptoms")
      .select("*")
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(mapSymptom));
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
    const { logDate, name, severity, notes } = body;

    if (!name?.trim() || !logDate || severity == null) {
      return NextResponse.json({ error: "name, logDate, and severity are required" }, { status: 400 });
    }

    const sev = Number(severity);
    if (sev < 1 || sev > 10) {
      return NextResponse.json({ error: "severity must be 1–10" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("symptoms")
      .insert({
        log_date: logDate,
        name: name.trim(),
        severity: sev,
        notes: notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const telegram = await sendHighSeverityTelegramIfNeeded({
      logDate: data.log_date,
      name: data.name,
      severity: data.severity,
      notes: data.notes,
    });

    return NextResponse.json(
      { ...mapSymptom(data), telegramAlert: telegram },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
