"use client";

import { AlertBanner } from "@/components/AlertBanner";
import type { Alert } from "@/lib/mock-data";

interface HomeCard {
  tab: string;
  title: string;
  stat: string;
  desc: string;
  color: string;
}

interface HomeViewProps {
  alerts: Alert[];
  patientName: string;
  cards: HomeCard[];
  onNavigate: (tab: string) => void;
}

export function HomeView({ alerts, patientName, cards, onNavigate }: HomeViewProps) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Active alerts for {patientName}
        </h2>
        <AlertBanner alerts={alerts} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          At a glance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <button
              key={card.tab}
              type="button"
              onClick={() => onNavigate(card.tab)}
              className={`rounded-2xl bg-gradient-to-br ${card.color} p-4 text-left text-white shadow-md transition hover:scale-[1.01] hover:shadow-lg`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                {card.title}
              </p>
              <p className="mt-1 text-3xl font-bold">{card.stat}</p>
              <p className="mt-1 text-sm text-white/90">{card.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
          Personal care agent
        </p>
        <p className="mt-2 text-base leading-relaxed text-slate-700">
          Log meds, symptoms, and visits on each tab. Use <strong>Ask agent</strong> to query
          everything in plain English — powered by Coral SQL locally.
        </p>
      </section>
    </div>
  );
}
