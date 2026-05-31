import type { Alert } from "@/lib/mock-data";

interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        No active alerts. All signals look stable today.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-xl border px-4 py-3 shadow-sm ${
            alert.severity === "critical"
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                alert.severity === "critical" ? "bg-red-600" : "bg-amber-500"
              }`}
              aria-hidden
            >
              !
            </span>
            <div>
              <p
                className={`font-semibold ${
                  alert.severity === "critical" ? "text-red-900" : "text-amber-900"
                }`}
              >
                {alert.title}
              </p>
              <p
                className={`mt-1 text-sm leading-relaxed ${
                  alert.severity === "critical" ? "text-red-800" : "text-amber-800"
                }`}
              >
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
