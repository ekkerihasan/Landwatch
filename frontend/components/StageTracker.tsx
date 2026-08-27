import type { StageHistoryRow } from "@/lib/types";

// The statutory sequence. The expected DURATIONS are not duplicated here — the API
// sends expected_days and days_vs_baseline on each row, computed from app/stages.py.
// Keeping a second copy is how the tracker and the card end up disagreeing.
const STAGES = ["3A", "3C", "3D", "3G", "3H", "3E"] as const;

const FALLBACK_LABELS: Record<string, string> = {
  "3A": "Notification of intent",
  "3C": "Declaration",
  "3D": "Land vests",
  "3G": "Compensation determined",
  "3H": "Compensation deposited",
  "3E": "Possession taken",
};

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
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Legal workflow</h2>
      <p className="mt-0.5 text-xs text-slate-500">
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
                    isDone ? "bg-teal-500" : "bg-slate-200"
                  }`}
                  aria-hidden
                />
              )}
              {/* Marker shape differs by state, not only colour (Design Brief §4) */}
              <span
                className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isDone
                    ? "bg-teal-500 text-white"
                    : isCurrent
                    ? overdue
                      ? "bg-red-600 text-white ring-4 ring-red-100"
                      : "bg-slate-900 text-white ring-4 ring-slate-100"
                    : "border-2 border-slate-200 bg-white text-slate-400"
                }`}
              >
                {isDone ? "✓" : stage.replace("3", "")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`font-mono text-sm font-semibold ${
                      isCurrent ? "text-slate-900" : isDone ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {stage}
                  </span>
                  <span className={`text-xs ${isCurrent || isDone ? "text-slate-600" : "text-slate-400"}`}>
                    {row?.label || FALLBACK_LABELS[stage]}
                  </span>
                  {isCurrent && (
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Current
                    </span>
                  )}
                </div>

                {row && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={overdue ? "font-semibold text-red-700" : "text-slate-500"}>
                      {row.elapsed_days} days{isCurrent ? " so far" : ""}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">expected ~{row.expected_days}</span>
                    {behind > 0 && (
                      <span
                        className={`rounded px-1.5 py-0.5 font-semibold ${
                          isCurrent
                            ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {behind} days behind baseline
                      </span>
                    )}
                    {behind < 0 && row.exited_at && (
                      <span className="rounded bg-teal-50 px-1.5 py-0.5 font-medium text-teal-700">
                        {Math.abs(behind)} days inside baseline
                      </span>
                    )}
                  </div>
                )}
                {!row && !isDone && <p className="mt-1 text-xs text-slate-400">Not yet reached</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
