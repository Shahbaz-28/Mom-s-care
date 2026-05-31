import type { Alert } from "@/lib/mock-data";

interface AlertBannerProps {
  alerts: Alert[];
  onAction?: (alert: Alert) => void;
  actionLabel?: (alert: Alert) => string;
}

export function AlertBanner({ alerts, onAction, actionLabel }: AlertBannerProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg text-white">
          ✓
        </span>
        <div>
          <p className="font-semibold text-emerald-900">You&apos;re all caught up</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-800">
            No missed meds, refills, or high-severity symptoms flagged right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "critical";
        const label = actionLabel?.(alert) ?? "View";

        return (
          <div
            key={alert.id}
            className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 ${
              isCritical
                ? "border-red-200/80 bg-red-50/90"
                : "border-amber-200/80 bg-amber-50/90"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                    isCritical ? "bg-red-600" : "bg-amber-500"
                  }`}
                  aria-hidden
                >
                  {isCritical ? "!" : "⚠"}
                </span>
                <div className="min-w-0">
                  <p
                    className={`font-semibold ${isCritical ? "text-red-950" : "text-amber-950"}`}
                  >
                    {alert.title}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      isCritical ? "text-red-800/90" : "text-amber-900/90"
                    }`}
                  >
                    {alert.message}
                  </p>
                </div>
              </div>
              {onAction && (
                <button
                  type="button"
                  onClick={() => onAction(alert)}
                  className={`shrink-0 self-start rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isCritical
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  }`}
                >
                  {label}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
