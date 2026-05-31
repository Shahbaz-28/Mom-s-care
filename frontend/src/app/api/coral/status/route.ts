import { NextResponse } from "next/server";
import { getCoralStatus } from "@/lib/integrations/coral-status";
import { scheduleCareJsonlSync } from "@/lib/integrations/jsonl-sync";
import { scanMissedMedicationTelegramAlerts } from "@/lib/medication-alerts";

export const runtime = "nodejs";

export async function GET() {
  try {
    scheduleCareJsonlSync();
    scanMissedMedicationTelegramAlerts().catch((err) => {
      console.error("[medication-alerts]", err instanceof Error ? err.message : err);
    });
    const status = await getCoralStatus();
    return NextResponse.json(status);
  } catch (e) {
    return NextResponse.json(
      {
        connected: false,
        sourceCount: 0,
        sources: [],
        expectedSources: ["care", "open_meteo", "openfda"],
        error: e instanceof Error ? e.message : "Coral status check failed",
      },
      { status: 200 }
    );
  }
}
