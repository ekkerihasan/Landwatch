import type { Prediction } from "@/lib/types";

const FEATURE_LABELS: Record<string, string> = {
  days_in_current_stage: "Time in current stage",
  stage_overrun_ratio: "Schedule overrun",
  open_litigations: "Unresolved litigation",
  resolved_litigations: "Resolved litigation",
  compensation_pct: "Compensation disbursed",
  paf_count: "Families affected",
  area: "Land area",
  stage_index: "Stage reached",
  prior_stage_avg_days: "Pace of earlier stages",
  current_stage: "Current legal stage",
};

/**
 * Top contributing factors — Design Brief §3.
 * SHAP values are signed: a factor can pull risk down as well as up, so bars run
 * both directions from a centre line.
 */
export function FactorPanel({ prediction }: { prediction: Prediction }) {
  const max = Math.max(...prediction.factors.map((f) => Math.abs(f.contribution)), 0.0001);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Why this risk level</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ranked by impact. Bars right of centre raise risk, left of centre lower it.
          </p>
        </div>
        <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {prediction.is_mock_prediction ? "Rule-based" : "SHAP"}
        </span>
      </div>

      <ul className="mt-5 space-y-4">
        {prediction.factors.map((f) => {
          const raises = f.contribution >= 0;
          const width = (Math.abs(f.contribution) / max) * 50; // % of full width, half each side
          return (
            <li key={f.feature}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-slate-800">
                  {FEATURE_LABELS[f.feature] ?? f.feature.replace(/_/g, " ")}
                </span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    raises ? "text-orange-700" : "text-teal-700"
                  }`}
                >
                  {raises ? "+" : ""}
                  {f.contribution.toFixed(3)}
                </span>
              </div>

              {/* Diverging bar: centre line = no effect */}
              <div className="relative mt-1.5 h-2 rounded-full bg-slate-100">
                <span className="absolute left-1/2 top-[-2px] h-3 w-px bg-slate-300" aria-hidden />
                <div
                  className={`absolute top-0 h-2 ${raises ? "rounded-r-full bg-orange-500" : "rounded-l-full bg-teal-500"}`}
                  style={
                    raises
                      ? { left: "50%", width: `${Math.max(width, 1)}%` }
                      : { right: "50%", width: `${Math.max(width, 1)}%` }
                  }
                  role="img"
                  aria-label={`${f.explanation}. ${raises ? "Raises" : "Lowers"} risk by ${Math.abs(
                    f.contribution
                  ).toFixed(3)}`}
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-600">
                {f.explanation}
                <span className={`ml-1 font-medium ${raises ? "text-orange-700" : "text-teal-700"}`}>
                  — {raises ? "raising" : "lowering"} risk
                </span>
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 border-t pt-3 text-[11px] leading-relaxed text-slate-500">
        These are contributing factors, <strong>not proven causes</strong> (PRD §4). They show
        what moved the score, not what will fix the delay.
      </p>
    </div>
  );
}
