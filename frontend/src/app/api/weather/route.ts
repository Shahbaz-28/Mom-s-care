import { NextResponse } from "next/server";
import { fetchDailyWeather } from "@/lib/integrations/open-meteo";
import { todayIso } from "@/lib/care-utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const end = searchParams.get("end") ?? todayIso();
    const start =
      searchParams.get("start") ??
      (() => {
        const d = new Date(end + "T12:00:00");
        d.setDate(d.getDate() - 13);
        return d.toISOString().slice(0, 10);
      })();

    const daily = await fetchDailyWeather(start, end);
    return NextResponse.json({ daily, source: "Open-Meteo" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Weather fetch failed" },
      { status: 500 }
    );
  }
}
