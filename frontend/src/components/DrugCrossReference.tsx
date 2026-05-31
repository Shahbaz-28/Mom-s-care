"use client";

import { useState } from "react";
import type { DrugMatch } from "@/lib/mock-data";
import { CareFormCard, inputClass, labelClass, submitClass } from "@/components/CareFormCard";

interface DrugCrossReferenceProps {
  matches: DrugMatch[];
  onAdd: (payload: { drug: string; reportedSymptom: string }) => Promise<void>;
}

export function DrugCrossReference({ matches, onAdd }: DrugCrossReferenceProps) {
  const [drug, setDrug] = useState("");
  const [reportedSymptom, setReportedSymptom] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!drug.trim() || !reportedSymptom.trim()) return;

    setSaving(true);
    setFormError(null);
    try {
      await onAdd({
        drug: drug.trim(),
        reportedSymptom: reportedSymptom.trim(),
      });
      setDrug("");
      setReportedSymptom("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <CareFormCard
        title="Add medication to check"
        description="OpenFDA uses US drug names (Paracetamol → Acetaminophen). Exact match when the symptom appears on the label."
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Medication name</label>
            <input
              className={inputClass}
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              placeholder="e.g. Amlodipine or Acetaminophen"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Symptom Mom reported</label>
            <input
              className={inputClass}
              value={reportedSymptom}
              onChange={(e) => setReportedSymptom(e.target.value)}
              placeholder="e.g. Dizziness on standing"
              required
            />
          </div>
          <div className="sm:col-span-2">
            {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
            <button type="submit" className={submitClass} disabled={saving}>
              {saving ? "Saving…" : "Save for FDA check"}
            </button>
          </div>
        </form>
      </CareFormCard>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">FDA drug cross-reference</h2>
        <p className="text-sm text-slate-500">
          OpenFDA side effects matched against symptoms Mom reported
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No entries yet. Add a medication and symptom above.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <article
              key={match.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800">
                  {match.drug}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    match.matchStrength === "exact"
                      ? "bg-red-100 text-red-700"
                      : match.matchStrength === "likely"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {match.matchStrength === "none" ? "no match" : `${match.matchStrength} match`}
                </span>
                <span className="text-xs text-slate-400">Last reported {match.lastReported}</span>
                {(match.matchStrength === "exact" || match.matchStrength === "likely") && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Live · OpenFDA
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    FDA label
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{match.fdaSideEffect}</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-400">
                    Mom reported
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-rose-900">{match.reportedSymptom}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
