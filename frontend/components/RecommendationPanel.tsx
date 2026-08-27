import type { Recommendation } from "@/lib/types";

const SEVERITY_STYLE: Record<number, { chip: string; label: string }> = {
  1: { chip: "bg-risk-criticalBg text-risk-critical ring-risk-critical/25", label: "Act now" },
  2: { chip: "bg-risk-highBg text-risk-high ring-orange-600/20", label: "This week" },
  3: { chip: "bg-cream-deep text-ink-2 ring-line", label: "Monitor" },
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
      <div className="rounded-card border bg-cream-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-ink">Recommended actions</h2>
        <p className="mt-3 rounded border border-risk-low/30 bg-risk-lowBg p-3 text-sm text-risk-low">
          Nothing is triggering an action. Compensation, litigation and schedule are all
          within their normal ranges.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border bg-cream-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Recommended actions</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Ordered by urgency. Each is owned by someone.
          </p>
        </div>
        <span className="shrink-0 rounded bg-cream-deep px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-2">
          Rule-based
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {recommendations.map((rec, i) => {
          const style = SEVERITY_STYLE[rec.severity] ?? SEVERITY_STYLE[3];
          return (
            <li key={rec.id} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-800 text-[10px] font-bold text-cream-surface">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink">{rec.action}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${style.chip}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">{rec.detail}</p>
                <p className="mt-1 text-[11px] text-ink-3">
                  Owner: <span className="font-medium text-ink-2">{rec.owner}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 border-t pt-3 text-[11px] leading-relaxed text-ink-3">
        These are administrative responses mapped from measured conditions — not model
        output, and not automatic. Nothing happens until an officer acts.
      </p>
    </div>
  );
}
