"use client";

import { useState } from "react";
import type { Appointment } from "@/lib/mock-data";
import { formatDateLabel, todayIso } from "@/lib/care-utils";
import { CareFormCard, inputClass, labelClass, submitClass } from "@/components/CareFormCard";

export interface AppointmentInput {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  notes?: string;
}

interface AppointmentTimelineProps {
  appointments: Appointment[];
  onAdd: (appt: Omit<AppointmentInput, "id">) => Promise<void>;
}

export function AppointmentTimeline({ appointments, onAdd }: AppointmentTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(appointments[0]?.id ?? null);
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [apptDate, setApptDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doctor.trim() || !specialty.trim()) return;

    setSaving(true);
    setFormError(null);
    try {
      await onAdd({
        date: apptDate,
        doctor: doctor.trim(),
        specialty: specialty.trim(),
        notes: notes.trim() || undefined,
      });
      setDoctor("");
      setSpecialty("");
      setNotes("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <CareFormCard
        title="Add appointment"
        description="Doctor visits for Mom — symptoms within 7 days will link automatically."
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Doctor</label>
            <input
              className={inputClass}
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="e.g. Dr. Patel"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Specialty / reason</label>
            <input
              className={inputClass}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Cardiology follow-up"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              className={inputClass}
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <input
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Questions for the doctor"
            />
          </div>
          <div className="sm:col-span-2">
            {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
            <button type="submit" className={submitClass} disabled={saving}>
              {saving ? "Saving…" : "Save appointment"}
            </button>
          </div>
        </form>
      </CareFormCard>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Appointment timeline</h2>
        <p className="text-sm text-slate-500">
          Symptoms reported within 7 days of each visit
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No appointments yet. Add one above.
        </div>
      ) : (
        <div className="relative space-y-0 pl-6">
          <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-slate-200" aria-hidden />

          {appointments.map((appt) => {
            const isExpanded = expandedId === appt.id;
            const isUpcoming = appt.status === "upcoming";

            return (
              <div key={appt.id} className="relative pb-6 last:pb-0">
                <span
                  className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 border-white shadow-sm ${
                    isUpcoming ? "bg-teal-500" : "bg-slate-400"
                  }`}
                  aria-hidden
                />

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                  className="ml-6 w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {appt.label || formatDateLabel(appt.date)} ·{" "}
                        {isUpcoming ? "Upcoming" : "Past"}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">{appt.specialty}</p>
                      <p className="text-sm text-slate-600">{appt.doctor}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isUpcoming
                          ? "bg-teal-100 text-teal-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {appt.relatedSymptoms.length} linked symptoms
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                        Nearby symptoms
                      </p>
                      {appt.relatedSymptoms.length === 0 ? (
                        <p className="text-sm text-slate-500">No symptoms logged within 7 days.</p>
                      ) : (
                        <ul className="space-y-2">
                          {appt.relatedSymptoms.map((sym) => (
                            <li
                              key={`${appt.id}-${sym.date}-${sym.name}`}
                              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span className="text-slate-700">
                                <span className="font-medium text-slate-900">{sym.name}</span>
                                <span className="text-slate-400"> · {sym.date}</span>
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                  sym.severity >= 8
                                    ? "bg-red-100 text-red-700"
                                    : sym.severity >= 5
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {sym.severity}/10
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
