"use client";

import { AlertBanner } from "@/components/AlertBanner";
import { formatDateLabel, todayIso } from "@/lib/care-utils";
import type { Alert } from "@/lib/mock-data";

import type { CoralStatusResponse } from "@/lib/api-client";

interface HomeCard {
  tab: string;
  title: string;
  stat: string;
  desc: string;
  icon: string;
  accent: string;
  ring: string;
}

interface HomeViewProps {
  alerts: Alert[];
  cards: HomeCard[];
  patternInsight?: string;
  coralStatus?: CoralStatusResponse | null;
  coralStatusLoading?: boolean;
  onNavigate: (tab: string) => void;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function alertActionTab(alert: Alert): string {
  if (alert.type === "med-missed" || alert.type === "refill-due") return "meds";
  if (alert.type === "high-symptom") return "pattern";
  return "home";
}

function alertActionLabel(alert: Alert): string {
  if (alert.type === "med-missed") return "Log medications";
  if (alert.type === "refill-due") return "View refills";
  if (alert.type === "high-symptom") return "View patterns";
  return "Open";
}

export function HomeView({
  alerts,
  cards,
  patternInsight,
  coralStatus,
  coralStatusLoading,
  onNavigate,
}: HomeViewProps) {
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const todayLabel = formatDateLabel(todayIso());
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  const quickActions = [
    { tab: "meds", label: "Log a med", icon: "💊", desc: "Taken or missed" },
    { tab: "pattern", label: "Log symptom", icon: "📋", desc: "Severity 1–10" },
    { tab: "ask", label: "Ask agent", icon: "💬", desc: "Plain English" },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-white via-teal-50/40 to-slate-50 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-200/30 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-teal-700">
            {greeting} · {todayLabel}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Your dashboard connects meds, symptoms, visits, and FDA checks — with alerts when
            something needs attention.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {coralStatusLoading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Checking Coral…
              </span>
            ) : coralStatus?.connected && coralStatus.sourceCount >= 3 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                Coral · {coralStatus.sourceCount} sources connected
              </span>
            ) : coralStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Coral · {coralStatus.sourceCount}/3 sources
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Coral offline · install locally for SQL joins
              </span>
            )}
            {coralStatus?.connected && coralStatus.sources.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs text-teal-800 ring-1 ring-teal-200">
                {coralStatus.sources.join(" · ")}
              </span>
            )}
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {warningCount} warning
              </span>
            )}
            {alerts.length === 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                All stable today
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quick actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.tab}
              type="button"
              onClick={() => onNavigate(action.tab)}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl transition group-hover:bg-teal-50">
                {action.icon}
              </span>
              <span>
                <span className="block font-semibold text-slate-900">{action.label}</span>
                <span className="block text-xs text-slate-500">{action.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Needs attention
          </h3>
          {alerts.length > 0 && (
            <span className="text-xs text-slate-400">{alerts.length} active</span>
          )}
        </div>
        <AlertBanner
          alerts={alerts}
          onAction={(alert) => onNavigate(alertActionTab(alert))}
          actionLabel={alertActionLabel}
        />
      </section>

      {/* Stats grid */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          At a glance
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <button
              key={card.tab}
              type="button"
              onClick={() => onNavigate(card.tab)}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md ${card.ring}`}
            >
              <div
                className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${card.accent}`}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3 pl-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-2 truncate text-2xl font-bold text-slate-900">{card.stat}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.desc}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg">
                  {card.icon}
                </span>
              </div>
              <p className="mt-4 pl-2 text-xs font-medium text-teal-700 opacity-0 transition group-hover:opacity-100">
                Open tab →
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Pattern insight */}
      {patternInsight && (
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg">
              ✨
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Pattern insight
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{patternInsight}</p>
              <button
                type="button"
                onClick={() => onNavigate("pattern")}
                className="mt-3 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
              >
                See full chart →
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
