import { NextResponse } from "next/server";
import { fetchOpenFdaLabel, matchDrugWithOpenFda } from "@/lib/integrations/openfda";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const drug = searchParams.get("drug");
    const symptom = searchParams.get("symptom");

    if (!drug?.trim()) {
      return NextResponse.json({ error: "drug query param is required" }, { status: 400 });
    }

    if (symptom?.trim()) {
      const result = await matchDrugWithOpenFda(drug.trim(), symptom.trim());
      return NextResponse.json({
        drug: drug.trim(),
        reportedSymptom: symptom.trim(),
        ...result,
        source: "OpenFDA",
      });
    }

    const text = await fetchOpenFdaLabel(drug.trim());
    return NextResponse.json({
      drug: drug.trim(),
      fdaSideEffect: text.slice(0, 500) || "No label text found for this drug name.",
      source: "OpenFDA",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OpenFDA fetch failed" },
      { status: 500 }
    );
  }
}
