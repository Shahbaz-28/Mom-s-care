import { NextResponse } from "next/server";
import { mapAppointmentInput } from "@/lib/mappers";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appt_date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(mapAppointmentInput));
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
    const { date, doctor, specialty, notes } = body;

    if (!date || !doctor?.trim() || !specialty?.trim()) {
      return NextResponse.json(
        { error: "date, doctor, and specialty are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        appt_date: date,
        doctor: doctor.trim(),
        specialty: specialty.trim(),
        notes: notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapAppointmentInput(data), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
