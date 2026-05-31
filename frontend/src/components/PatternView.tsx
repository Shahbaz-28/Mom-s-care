"use client";

import { useState } from "react";
import type { DailyPattern, SymptomEntry } from "@/lib/mock-data";
import { todayIso } from "@/lib/care-utils";
import { CareFormCard, inputClass, labelClass, submitClass } from "@/components/CareFormCard";

export interface SymptomPayload {
  date: string;
  name: string;
  severity: number;
  notes?: string;
}

interface PatternViewProps {
  data: DailyPattern[];
  insight: string;
  weatherInsight: string | null;
  loadingPatterns?: boolean;
  symptoms: SymptomEntry[];
  onAddSymptom: (
    symptom: SymptomPayload
  ) => Promise<{ telegramAlert?: { sent: boolean; error?: string } } | void>;
}

const CHART_W = 720;
const CHART_H = 260;
const PAD = { top: 20, right: 16, bottom: 36, left: 40 };

function scaleX(index: number, count: number) {
  const inner = CHART_W - PAD.left - PAD.right;
  return PAD.left + (index / Math.max(count - 1, 1)) * inner;
}

function scaleY(value: number, max: number) {
  const inner = CHART_H - PAD.top - PAD.bottom;
  return PAD.top + inner - (value / max) * inner;
}

export function PatternView({
  data,
  insight,
  weatherInsight,
  loadingPatterns,
  symptoms,
  onAddSymptom,
}: PatternViewProps) {
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState(5);
  const [logDate, setLogDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [telegramNotice, setTelegramNotice] = useState<string | null>(null);

  const sortedSymptoms = [...symptoms].sort((a, b) => b.date.localeCompare(a.date));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setFormError(null);
    setTelegramNotice(null);
    try {
      const result = await onAddSymptom({
        date: logDate,
        name: name.trim(),
        severity,
        notes: notes.trim() || undefined,
      });
      if (result?.telegramAlert?.sent) {
        setTelegramNotice("Telegram alert sent to caregiver.");
      } else if (severity >= 8 && result?.telegramAlert?.error) {
        setTelegramNotice(`Saved, but Telegram failed: ${result.telegramAlert.error}`);
      }
      setName("");
      setNotes("");
      setSeverity(5);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const chartData = data.length > 0 ? data : [];
  const symptomPoints = chartData
    .map((d, i) => {
      if (d.symptomSeverity == null) return null;
      return `${scaleX(i, chartData.length)},${scaleY(d.symptomSeverity, 10)}`;
    })
    .filter(Boolean)
    .join(" ");

  const tempPoints = chartData
    .map((d, i) => `${scaleX(i, chartData.length)},${scaleY((d.tempF - 60) / 2, 10)}`)
    .join(" ");

  return (
    <div className="space-y-6">
      <CareFormCard
        title="Log a symptom"
        description="Track what Mom reported — severity 1–10. Shown below and linked to visits."
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Symptom</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chest tightness"
              required
            />
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
          <div className="sm:col-span-2">
            <label className={labelClass}>Severity: {severity}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              className={`${inputClass} min-h-[72px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="When it started, triggers, etc."
            />
          </div>
          <div className="sm:col-span-2">
            {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
            {telegramNotice && (
              <p
                className={`mb-2 text-sm ${
                  telegramNotice.includes("failed") ? "text-amber-700" : "text-teal-700"
                }`}
              >
                {telegramNotice}
              </p>
            )}
            <button type="submit" className={submitClass} disabled={saving}>
              {saving ? "Saving…" : "Save symptom"}
            </button>
          </div>
        </form>
      </CareFormCard>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900">Recent symptoms you logged</h3>
        {sortedSymptoms.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No symptoms yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedSymptoms.slice(0, 8).map((s) => (
              <li
                key={s.id ?? `${s.date}-${s.name}`}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-slate-900">{s.name}</span>
                  <span className="text-slate-400"> · {s.date}</span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    s.severity >= 8
                      ? "bg-red-100 text-red-700"
                      : s.severity >= 5
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {s.severity}/10
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Symptom & adherence patterns</h2>
            <p className="text-sm text-slate-500">
              Your logs + live daily temperature from Open-Meteo
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-rose-500" />
              Symptom severity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-sky-400" />
              Temperature (°F, scaled)
            </span>
          </div>
        </div>

        {loadingPatterns ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading chart from Open-Meteo…</p>
        ) : chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Log meds and symptoms to build the pattern chart.
          </p>
        ) : (
        <>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="min-w-[640px] w-full"
            role="img"
            aria-label="Chart of symptom severity, medication adherence, and temperature over time"
          >
            {[0, 2, 4, 6, 8, 10].map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  y1={scaleY(tick, 10)}
                  x2={CHART_W - PAD.right}
                  y2={scaleY(tick, 10)}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD.left - 8}
                  y={scaleY(tick, 10) + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                >
                  {tick}
                </text>
              </g>
            ))}

            <polyline
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeLinejoin="round"
              points={tempPoints}
              opacity={0.7}
            />
            <polyline
              fill="none"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinejoin="round"
              points={symptomPoints}
            />

            {chartData.map((day, i) => {
              const missed = day.medsTotal - day.medsTaken;
              const cx = scaleX(i, chartData.length);
              const cy = scaleY(day.symptomSeverity ?? 0, 10);
              return (
                <g key={day.date}>
                  <circle
                    cx={cx}
                    cy={CHART_H - PAD.bottom + 10}
                    r={missed > 0 ? 5 : 4}
                    fill={missed > 0 ? "#ef4444" : "#10b981"}
                    opacity={0.9}
                  />
                  {day.symptomSeverity != null && (
                    <circle cx={cx} cy={cy} r={5} fill="#e11d48" stroke="#fff" strokeWidth="2" />
                  )}
                  <text
                    x={cx}
                    y={CHART_H - 8}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px]"
                  >
                    {day.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {chartData.slice(-3).map((day) => (
            <div
              key={day.date}
              className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
            >
              <span className="font-medium text-slate-800">{day.label}</span>
              {" · "}
              {day.symptomName ?? "No symptom"} ({day.symptomSeverity ?? "—"}/10)
              {" · "}
              {day.medsTaken}/{day.medsTotal} meds · {day.tempF}°F
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Agent insight
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug text-indigo-950">{insight}</p>
      </div>

      {weatherInsight && (
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            Weather context · Open-Meteo
          </p>
          <p className="mt-2 text-sm leading-relaxed text-sky-950">{weatherInsight}</p>
        </div>
      )}
    </div>
  );
}
