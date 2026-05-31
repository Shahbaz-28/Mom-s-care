"use client";

import { useState } from "react";
import type { Medication } from "@/lib/mock-data";
import { todayIso } from "@/lib/care-utils";
import { CareFormCard, inputClass, labelClass, submitClass } from "@/components/CareFormCard";

export interface MedicationPayload {
  name: string;
  dose: string;
  schedule: string;
  logDate: string;
  takenToday: boolean;
  refillDue: string;
}

interface MedicationTrackerProps {
  medications: Medication[];
  onAdd: (payload: MedicationPayload) => Promise<void>;
}

export function MedicationTracker({ medications, onAdd }: MedicationTrackerProps) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [schedule, setSchedule] = useState("Morning");
  const [logDate, setLogDate] = useState(todayIso());
  const [refillDue, setRefillDue] = useState("");
  const [taken, setTaken] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sorted = [...medications].sort((a, b) => b.logDate.localeCompare(a.logDate));
  const todayMeds = medications.filter((m) => m.logDate === todayIso());
  const takenCount = todayMeds.filter((m) => m.takenToday).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dose.trim()) return;

    setSaving(true);
    setFormError(null);
    try {
      await onAdd({
        name: name.trim(),
        dose: dose.trim(),
        schedule,
        logDate,
        takenToday: taken,
        refillDue: refillDue || todayIso(),
      });
      setName("");
      setDose("");
      setTaken(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <CareFormCard
        title="Log a medication"
        description="Record whether a pill was taken. Saved to Supabase."
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Medication name</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lisinopril"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Dose</label>
            <input
              className={inputClass}
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 10 mg"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Schedule</label>
            <select
              className={inputClass}
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            >
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
              <option>Bedtime</option>
              <option>With meals</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              className={inputClass}
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Refill due</label>
            <input
              type="date"
              className={inputClass}
              value={refillDue}
              onChange={(e) => setRefillDue(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={taken}
                onChange={(e) => setTaken(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Taken today
            </label>
          </div>
          <div className="sm:col-span-2">
            {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
            <button type="submit" className={submitClass} disabled={saving}>
              {saving ? "Saving…" : "Save medication log"}
            </button>
          </div>
        </form>
      </CareFormCard>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Medication history</h2>
            <p className="text-sm text-slate-500">
              Today: {takenCount} of {todayMeds.length || "0"} logged as taken
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Refills within 5 days highlighted
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No medications logged yet. Use the form above to add the first entry.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Medication</th>
                    <th className="px-4 py-3 font-semibold">Schedule</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Refill due</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((med) => {
                    const refillSoon = med.daysUntilRefill <= 5 && med.daysUntilRefill >= 0;
                    return (
                      <tr
                        key={med.id}
                        className={`border-b border-slate-50 last:border-0 ${
                          refillSoon ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <td className="px-4 py-4 text-slate-600">{med.logDate}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900">{med.name}</p>
                          <p className="text-xs text-slate-500">{med.dose}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{med.schedule}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              med.takenToday
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {med.takenToday ? "✓ Taken" : "✗ Missed"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`font-medium ${
                              refillSoon ? "text-amber-700" : "text-slate-700"
                            }`}
                          >
                            {med.refillDue}
                          </span>
                          {refillSoon && (
                            <p className="text-xs font-medium text-amber-600">
                              {med.daysUntilRefill} days left
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
