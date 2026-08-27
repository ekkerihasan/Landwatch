import type { Recommendation } from "@/lib/types";

const SEVERITY_STYLE: Record<number, { chip: string; label: string }> = {
  1: { chip: "bg-red-100 text-red-800 ring-red-600/20", label: "Act now" },
  2: { chip: "bg-orange-100 text-orange-800 ring-orange-600/20", label: "This week" },
  3: { chip: "bg-slate-100 text-slate-700 ring-slate-500/20", label: "Monitor" },
};

/**
 * Recommended actions — PRD §6.
 * These come from a rule catalogue in app/factor_config.py, not from the model.
 * That distinction is the point: the prediction is learned and probabilistic, the
 * response to it is deterministic and auditable.
 */
export function RecommendationPanel({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Recommended actions</h2>
        <p className="mt-3 rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
          Nothing is triggering an action. Compensation, litigation and schedule are all
          within their normal ranges.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recommended actions</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ordered by urgency. Each is owned by someone.
          </p>
        </div>
        <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Rule-based
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {recommendations.map((rec, i) => {
          const style = SEVERITY_STYLE[rec.severity] ?? SEVERITY_STYLE[3];
          return (
            <li key={rec.id} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-900">{rec.action}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${style.chip}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{rec.detail}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Owner: <span className="font-medium text-slate-700">{rec.owner}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 border-t pt-3 text-[11px] leading-relaxed text-slate-500">
        These are administrative responses mapped from measured conditions — not model
        output, and not automatic. Nothing happens until an officer acts.
      </p>
    </div>
  );
}
