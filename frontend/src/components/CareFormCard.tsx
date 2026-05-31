interface CareFormCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function CareFormCard({ title, description, children }: CareFormCardProps) {
  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-semibold text-teal-900">{title}</h3>
      {description && <p className="mt-1 text-xs text-teal-800/70">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 focus:ring-2";

export const labelClass = "mb-1 block text-xs font-medium text-slate-600";

export const submitClass =
  "rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50";
