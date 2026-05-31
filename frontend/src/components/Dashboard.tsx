"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AskAgent } from "@/components/AskAgent";
import { HomeView } from "@/components/HomeView";
import { PatternView } from "@/components/PatternView";
import { MedicationTracker } from "@/components/MedicationTracker";
import {
  AppointmentTimeline,
  type AppointmentInput,
} from "@/components/AppointmentTimeline";
import { DrugCrossReference } from "@/components/DrugCrossReference";
import { WeeklySummary } from "@/components/WeeklySummary";
import {
  createAppointment,
  createDrugCheck,
  createMedication,
  createSymptom,
  fetchAllCareData,
  fetchPatterns,
} from "@/lib/api-client";
import { buildAlerts, buildAppointments, todayIso } from "@/lib/care-utils";
import {
  navItems,
  patientName,
  weeklySummary,
  type DailyPattern,
  type DrugMatch,
  type Medication,
  type SymptomEntry,
  type TabId,
} from "@/lib/mock-data";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [symptoms, setSymptoms] = useState<(SymptomEntry & { id: string })[]>([]);
  const [appointmentRecords, setAppointmentRecords] = useState<AppointmentInput[]>([]);
  const [drugMatches, setDrugMatches] = useState<DrugMatch[]>([]);
  const [patterns, setPatterns] = useState<DailyPattern[]>([]);
  const [patternInsight, setPatternInsight] = useState("");
  const [weatherInsight, setWeatherInsight] = useState<string | null>(null);
  const [weatherLocation, setWeatherLocation] = useState("Delhi, India");
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatterns = useCallback(async () => {
    setPatternsLoading(true);
    try {
      const data = await fetchPatterns();
      setPatterns(data.patterns);
      setPatternInsight(data.insight);
      setWeatherInsight(data.weatherInsight);
      setWeatherLocation(data.weatherLocation ?? "Delhi, India");
    } catch {
      setPatterns([]);
      setPatternInsight("Add symptoms and medication logs to detect patterns.");
      setWeatherInsight(null);
    } finally {
      setPatternsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAllCareData();
      setMedications(data.medications);
      setSymptoms(data.symptoms);
      setAppointmentRecords(data.appointmentRecords);
      setDrugMatches(data.drugMatches);
      await loadPatterns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [loadPatterns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const appointments = useMemo(
    () => buildAppointments(appointmentRecords, symptoms),
    [appointmentRecords, symptoms]
  );

  const alerts = useMemo(() => buildAlerts(medications, symptoms), [medications, symptoms]);

  const homeCards = useMemo(() => {
    const todayMeds = medications.filter((m) => m.logDate === todayIso());
    const takenToday = todayMeds.filter((m) => m.takenToday).length;
    const nextAppt = appointments.find((a) => a.status === "upcoming");

    return [
      {
        tab: "pattern",
        title: "Symptoms logged",
        stat: String(symptoms.length),
        desc: "Open Patterns to add more",
        color: "from-indigo-500 to-violet-600",
      },
      {
        tab: "meds",
        title: "Today's meds",
        stat: `${takenToday} / ${todayMeds.length}`,
        desc: "Log taken or missed on Meds tab",
        color: "from-teal-500 to-emerald-600",
      },
      {
        tab: "visits",
        title: "Next visit",
        stat: nextAppt ? nextAppt.label : "—",
        desc: nextAppt ? nextAppt.specialty : "Add an appointment",
        color: "from-sky-500 to-blue-600",
      },
      {
        tab: "drugs",
        title: "FDA checks",
        stat: String(drugMatches.length),
        desc: "Medications queued for cross-reference",
        color: "from-rose-500 to-orange-500",
      },
    ];
  }, [medications, symptoms.length, appointments, drugMatches.length]);

  return (
    <div className="flex min-h-full flex-col bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Personal care agent
            </p>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {patientName}&apos;s care
            </h1>
            <p className="text-sm text-slate-500">Caregiver&apos;s second set of eyes</p>
          </div>
          <div className="hidden rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800 sm:block">
            Supabase + OpenFDA + Meteo
          </div>
        </div>

        <nav
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition sm:px-4 ${
                activeTab === item.id
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="mx-auto mt-4 w-full max-w-5xl px-4 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadData();
              }}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-500">
            Loading care data…
          </div>
        ) : (
          <>
            {activeTab === "home" && (
              <HomeView
                alerts={alerts}
                patientName={patientName}
                cards={homeCards}
                onNavigate={(tab) => setActiveTab(tab as TabId)}
              />
            )}
            {activeTab === "ask" && <AskAgent />}
            {activeTab === "pattern" && (
              <PatternView
                data={patterns}
                insight={patternInsight}
                weatherInsight={weatherInsight}
                weatherLocation={weatherLocation}
                loadingPatterns={patternsLoading}
                symptoms={symptoms}
                onAddSymptom={async (payload) => {
                  const saved = await createSymptom({
                    logDate: payload.date,
                    name: payload.name,
                    severity: payload.severity,
                    notes: payload.notes,
                  });
                  setSymptoms((prev) => [saved, ...prev]);
                  await loadPatterns();
                  return { telegramAlert: saved.telegramAlert };
                }}
              />
            )}
            {activeTab === "meds" && (
              <MedicationTracker
                medications={medications}
                onAdd={async (payload) => {
                  const saved = await createMedication({
                    name: payload.name,
                    dose: payload.dose,
                    schedule: payload.schedule,
                    logDate: payload.logDate,
                    taken: payload.takenToday,
                    refillDue: payload.refillDue,
                  });
                  setMedications((prev) => [saved, ...prev]);
                  await loadPatterns();
                }}
              />
            )}
            {activeTab === "visits" && (
              <AppointmentTimeline
                appointments={appointments}
                onAdd={async (payload) => {
                  const saved = await createAppointment({
                    date: payload.date,
                    doctor: payload.doctor,
                    specialty: payload.specialty,
                    notes: payload.notes,
                  });
                  setAppointmentRecords((prev) => [saved, ...prev]);
                }}
              />
            )}
            {activeTab === "drugs" && (
              <DrugCrossReference
                matches={drugMatches}
                onAdd={async (payload) => {
                  const saved = await createDrugCheck({
                    drug: payload.drug,
                    reportedSymptom: payload.reportedSymptom,
                  });
                  setDrugMatches((prev) => [saved, ...prev]);
                }}
              />
            )}
            {activeTab === "weekly" && <WeeklySummary rows={weeklySummary} />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
        Supabase · OpenFDA · Open-Meteo
      </footer>
    </div>
  );
}
