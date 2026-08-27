import type { StageHistoryRow } from "@/lib/types";

// The statutory sequence. The expected DURATIONS are not duplicated here — the API
// sends expected_days and days_vs_baseline on each row, computed from app/stages.py.
// Keeping a second copy is how the tracker and the card end up disagreeing.
const STAGES = ["3A", "3C", "3D", "3G", "3H", "3E"] as const;

import { STAGE_LABELS } from "@/lib/stages";

export function StageTracker({
  history,
  currentStage,
}: {
  history: StageHistoryRow[];
  currentStage: string;
}) {
  const byStage = new Map(history.map((h) => [h.stage, h]));
  const currentIndex = STAGES.indexOf(currentStage as (typeof STAGES)[number]);

  return (
    <div className="rounded-card border bg-cream-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Legal workflow</h2>
      <p className="mt-0.5 text-xs text-ink-3">
        Statutory sequence 3A → 3E. A stage running well past its expected duration is
        the strongest single delay signal.
      </p>

      <ol className="mt-5 space-y-0">
        {STAGES.map((stage, i) => {
          const row = byStage.get(stage);
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          const behind = row ? row.days_vs_baseline : 0;
          const overdue = isCurrent && behind > 0;

          return (
            <li key={stage} className="relative flex gap-3 pb-5 last:pb-0">
              {i < STAGES.length - 1 && (
                <span
                  className={`absolute left-[11px] top-6 h-full w-0.5 ${
                    isDone ? "bg-risk-low" : "bg-cream-deep"
                  }`}
                  aria-hidden
                />
              )}
              {/* Marker shape differs by state, not only colour (Design Brief §4) */}
              <span
                className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isDone
                    ? "bg-risk-low text-cream-surface"
                    : isCurrent
                    ? overdue
                      ? "bg-risk-critical text-cream-surface ring-4 ring-risk-critical/15"
                      : "bg-forest-800 text-cream-surface ring-4 ring-forest-800/12"
                    : "border-2 border-line bg-cream-surface text-ink-3"
                }`}
              >
                {isDone ? "✓" : stage.replace("3", "")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`font-mono text-sm font-semibold ${
                      isCurrent ? "text-ink" : isDone ? "text-ink-2" : "text-ink-3"
                    }`}
                  >
                    {stage}
                  </span>
                  <span className={`text-xs ${isCurrent || isDone ? "text-ink-2" : "text-ink-3"}`}>
                    {row?.label || STAGE_LABELS[stage]}
                  </span>
                  {isCurrent && (
                    <span className="rounded bg-forest-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream-surface">
                      Current
                    </span>
                  )}
                </div>

                {row && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={overdue ? "font-semibold text-risk-critical" : "text-ink-3"}>
                      {row.elapsed_days} days{isCurrent ? " so far" : ""}
                    </span>
                    <span className="text-ink-3">·</span>
                    <span className="text-ink-3">expected ~{row.expected_days}</span>
                    {behind > 0 && (
                      <span
                        className={`rounded px-1.5 py-0.5 font-semibold ${
                          isCurrent
                            ? "bg-risk-criticalBg text-risk-critical ring-1 ring-risk-critical/25"
                            : "bg-cream-deep text-ink-2"
                        }`}
                      >
                        {behind} days behind baseline
                      </span>
                    )}
                    {behind < 0 && row.exited_at && (
                      <span className="rounded bg-risk-lowBg px-1.5 py-0.5 font-medium text-risk-low">
                        {Math.abs(behind)} days inside baseline
                      </span>
                    )}
                  </div>
                )}
                {!row && !isDone && <p className="mt-1 text-xs text-ink-3">Not yet reached</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
