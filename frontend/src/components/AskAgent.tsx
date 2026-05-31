"use client";

import { useState } from "react";
import { EXAMPLE_QUESTIONS } from "@/lib/ask-agent";
import { askCareAgent, type AskResponse } from "@/lib/api-client";
import { CareFormCard, inputClass, submitClass } from "@/components/CareFormCard";

export function AskAgent() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [showSql, setShowSql] = useState(false);

  async function handleAsk(text?: string) {
    const q = (text ?? question).trim();
    if (!q) return;

    setQuestion(q);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await askCareAgent(q);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get an answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Personal care agent
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Ask about Mom&apos;s care</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Type a question in plain English. The agent picks a Coral SQL query across care logs,
          weather, and FDA — then summarizes the answer for you.
        </p>
      </section>

      <CareFormCard
        title="Your question"
        description='Try: "Did dizziness happen after missed pills when it was hot?"'
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <textarea
            className={`${inputClass} min-h-[96px] resize-y`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about symptoms, meds, weather, or FDA labels…"
            required
          />
          <button type="submit" className={submitClass} disabled={loading || !question.trim()}>
            {loading ? "Searching care data…" : "Ask agent"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleAsk(example)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
            >
              {example}
            </button>
          ))}
        </div>
      </CareFormCard>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                {result.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                via {result.source === "coral" ? "Coral SQL" : "Supabase fallback"}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-slate-800">
              {result.answer}
            </p>
            {result.note && (
              <p className="mt-3 text-xs text-amber-700">{result.note}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setShowSql((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-slate-700"
            >
              <span>Coral SQL used</span>
              <span className="text-slate-400">{showSql ? "Hide" : "Show"}</span>
            </button>
            {showSql && (
              <pre className="overflow-x-auto border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-700">
                {result.sql}
              </pre>
            )}
          </div>

          {result.rows.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-700">
                Data ({result.rows.length} row{result.rows.length === 1 ? "" : "s"})
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {result.columns.map((col) => (
                        <th key={col} className="px-4 py-2 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.rows.map((row, i) => (
                      <tr key={i} className="text-slate-700">
                        {result.columns.map((col) => (
                          <td key={col} className="max-w-xs truncate px-4 py-2 align-top">
                            {formatCell(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}
