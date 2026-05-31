import type { WeeklyRow } from "@/lib/mock-data";

interface WeeklySummaryProps {
  rows: WeeklyRow[];
  loading?: boolean;
  source?: string;
}

export function WeeklySummary({ rows, loading, source }: WeeklySummaryProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Weekly summary</h2>
        <p className="text-sm text-slate-500">
          Rolled up from your saved symptoms, medications, and appointments
          {source ? ` · ${source}` : ""}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          Loading weekly stats…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
          No logs yet. Add symptoms, meds, or visits — weekly rows will appear here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Week</th>
                  <th className="px-4 py-3 font-semibold text-center">Symptoms</th>
                  <th className="px-4 py-3 font-semibold text-center">Missed doses</th>
                  <th className="px-4 py-3 font-semibold text-center">Appointments</th>
                  <th className="px-4 py-3 font-semibold text-center">Avg severity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isWorst = row.avgSeverity >= 6;
                  return (
                    <tr
                      key={row.week}
                      className={`border-b border-slate-50 last:border-0 ${
                        isWorst ? "bg-red-50/40" : i === 0 ? "bg-teal-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{row.weekLabel}</p>
                        <p className="text-xs text-slate-400">{row.week}</p>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-slate-700">
                        {row.symptomCount}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`font-medium ${
                            row.missedDoses >= 5 ? "text-red-600" : "text-slate-700"
                          }`}
                        >
                          {row.missedDoses}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-700">
                        {row.appointments}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex min-w-[3rem] justify-center rounded-full px-2 py-1 text-xs font-bold ${
                            row.avgSeverity >= 6
                              ? "bg-red-100 text-red-700"
                              : row.avgSeverity >= 4
                                ? "bg-amber-100 text-amber-700"
                                : row.avgSeverity > 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.symptomCount > 0 ? row.avgSeverity.toFixed(1) : "—"}
                        </span>
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
  );
}
