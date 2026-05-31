import { isCoralAvailable, runCoralSql } from "@/lib/integrations/coral-runner";

const EXPECTED_SOURCES = ["care", "open_meteo", "openfda"] as const;

export interface CoralStatus {
  connected: boolean;
  sourceCount: number;
  sources: string[];
  expectedSources: readonly string[];
  version?: string;
}

export async function getCoralStatus(): Promise<CoralStatus> {
  const available = await isCoralAvailable();
  if (!available) {
    return {
      connected: false,
      sourceCount: 0,
      sources: [],
      expectedSources: EXPECTED_SOURCES,
    };
  }

  try {
    const result = await runCoralSql(
      "SELECT DISTINCT schema_name FROM coral.tables WHERE schema_name IN ('care','open_meteo','openfda') ORDER BY 1"
    );
    const sources = result.rows
      .map((r) => String(r.schema_name ?? ""))
      .filter((s) => EXPECTED_SOURCES.includes(s as (typeof EXPECTED_SOURCES)[number]));

    return {
      connected: sources.length > 0,
      sourceCount: sources.length,
      sources,
      expectedSources: EXPECTED_SOURCES,
    };
  } catch {
    return {
      connected: false,
      sourceCount: 0,
      sources: [],
      expectedSources: EXPECTED_SOURCES,
    };
  }
}
