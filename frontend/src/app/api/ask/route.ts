import { NextResponse } from "next/server";
import {
  fallbackHint,
  planQuestion,
  synthesizeAnswer,
} from "@/lib/ask-agent";
import { runAskFallback } from "@/lib/ask-fallback";
import { runCoralSql } from "@/lib/integrations/coral-runner";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim() ?? "";

    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const plan = planQuestion(question);
    let rows: Record<string, unknown>[] = [];
    let columns: string[] = [];
    let source: "coral" | "supabase" = "coral";
    let note: string | undefined;

    try {
      const result = await runCoralSql(plan.sql);
      rows = result.rows;
      columns = result.columns;
    } catch {
      rows = await runAskFallback(question, plan);
      columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      source = "supabase";
      note = fallbackHint();
    }

    const answer = synthesizeAnswer(question, plan, rows);

    return NextResponse.json({
      answer,
      sql: plan.sql,
      intent: plan.intent,
      label: plan.label,
      columns,
      rows,
      source,
      note,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ask agent failed" },
      { status: 500 }
    );
  }
}
