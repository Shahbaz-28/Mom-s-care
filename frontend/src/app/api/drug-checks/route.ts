import { NextResponse } from "next/server";
import { matchDrugWithOpenFda } from "@/lib/integrations/openfda";
import { mapDrugCheck } from "@/lib/mappers";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("drug_checks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(mapDrugCheck));
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
    const { drug, reportedSymptom } = body;

    if (!drug?.trim() || !reportedSymptom?.trim()) {
      return NextResponse.json(
        { error: "drug and reportedSymptom are required" },
        { status: 400 }
      );
    }

    const fdaMatch = await matchDrugWithOpenFda(drug.trim(), reportedSymptom.trim());

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("drug_checks")
      .insert({
        drug: drug.trim(),
        reported_symptom: reportedSymptom.trim(),
        fda_side_effect: fdaMatch.fdaSideEffect,
        match_strength: fdaMatch.matchStrength,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapDrugCheck(data), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
