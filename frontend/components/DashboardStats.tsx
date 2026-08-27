import type { Project } from "@/lib/types";

/**
 * Portfolio totals.
 *
 * Every figure is computed from the projects the API returned. Nothing here is a
 * placeholder number — in a system whose entire argument is that it does not
 * overclaim, an invented headline figure is the one thing that would undo it.
 *
 * Note what is absent: a rupee total. The schema stores compensation as a
 * PERCENTAGE, and there is no currency field anywhere, so a "₹ Cr disbursed" tile
 * could only be fabricated. Mean disbursement is shown instead — same subject,
 * actually derivable.
 */
export function DashboardStats({ projects }: { projects: Project[] }) {
  const totalArea = projects.reduce((s, p) => s + (p.area ?? 0), 0);
  const totalFamilies = projects.reduce((s, p) => s + (p.paf_count ?? 0), 0);
  const atRisk = projects.filter(
    (p) => p.prediction.risk_class === "High" || p.prediction.risk_class === "Critical"
  ).length;
  const withRehab = projects.filter((p) => p.rehabilitation_progress_pct != null);
  const meanRehab = withRehab.length
    ? withRehab.reduce((s, p) => s + (p.rehabilitation_progress_pct ?? 0), 0) / withRehab.length
    : null;

  const tiles = [
    {
      label: "Projects monitored",
      value: projects.length.toLocaleString("en-IN"),
      note: "in this portfolio",
    },
    {
      label: "Land under acquisition",
      value: totalArea.toLocaleString("en-IN", { maximumFractionDigits: 1 }),
      unit: "ha",
      note: "across all projects",
    },
    {
      label: "Families affected",
      value: totalFamilies.toLocaleString("en-IN"),
      note: "project-affected families",
    },
    {
      label: "Mean R&R progress",
      value: meanRehab != null ? Math.round(meanRehab).toString() : "—",
      unit: meanRehab != null ? "%" : undefined,
      note: "rehabilitation & resettlement",
    },
    {
      label: "Needing attention",
      value: atRisk.toString(),
      note: "High or Critical risk",
      alert: atRisk > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-card border bg-cream-surface p-4 shadow-card ${
            t.alert ? "border-risk-high/35" : "border-line"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            {t.label}
          </p>
          <p className="mt-2 flex items-baseline gap-1">
            <span
              className={`lw-nums text-2xl font-bold tracking-tight ${
                t.alert ? "text-risk-high" : "text-forest-800"
              }`}
            >
              {t.value}
            </span>
            {t.unit && <span className="text-sm font-medium text-ink-3">{t.unit}</span>}
          </p>
          <p className="mt-1 text-[11px] text-ink-3">{t.note}</p>
        </div>
      ))}
    </div>
  );
}
