"use client";

import { useState } from "react";
import { runWhatIf } from "@/lib/api";
import type { CurrentFeatures, WhatIfResponse } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

const SLIDERS = [
  {
    key: "compensation_pct" as const,
    label: "Compensation disbursed",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    hint: "Raising disbursement is usually the officer's most direct lever.",
  },
  {
    key: "open_litigations" as const,
    label: "Unresolved litigation",
    min: 0,
    max: 10,
    step: 1,
    unit: " cases",
    hint: "Resolving or consolidating cases.",
  },
  {
    key: "days_in_current_stage" as const,
    label: "Days in current stage",
    min: 0,
    max: 400,
    step: 5,
    unit: " days",
    hint: "Where the project would stand if the stage cleared sooner.",
  },
];

export function WhatIfPanel({
  projectId,
  baseline,
}: {
  projectId: number;
  baseline: CurrentFeatures;
}) {
  const [values, setValues] = useState<CurrentFeatures>(baseline);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = SLIDERS.filter((s) => values[s.key] !== baseline[s.key]);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const overrides = Object.fromEntries(changed.map((s) => [s.key, values[s.key]]));
      setResult(await runWhatIf(projectId, overrides));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setValues(baseline);
    setResult(null);
    setError(null);
  }

  return (
    <div className="rounded-card border bg-cream-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">What-if simulator</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Adjust an actionable input and re-score. Nothing here changes the project record.
          </p>
        </div>
        <span className="shrink-0 rounded bg-cream-deep px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-2">
          Scenario
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {SLIDERS.map((s) => {
          const isChanged = values[s.key] !== baseline[s.key];
          return (
            <div key={s.key}>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={s.key} className="text-sm font-medium text-ink">
                  {s.label}
                </label>
                <span className="font-mono text-xs tabular-nums text-ink-2">
                  {values[s.key]}
                  {s.unit}
                  {isChanged && (
                    <span className="ml-1.5 text-ink-3">
                      (was {baseline[s.key]}
                      {s.unit})
                    </span>
                  )}
                </span>
              </div>
              <input
                id={s.key}
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={values[s.key]}
                onChange={(e) => setValues({ ...values, [s.key]: Number(e.target.value) })}
                className="mt-2 w-full accent-forest-700"
              />
              <p className="mt-1 text-[11px] text-ink-3">{s.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={busy || changed.length === 0}
          className="rounded bg-forest-800 px-3.5 py-2 text-sm font-medium text-cream-surface hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-line"
        >
          {busy ? "Re-scoring…" : "Run scenario"}
        </button>
        {(changed.length > 0 || result) && (
          <button
            onClick={reset}
            className="rounded border border-line px-3.5 py-2 text-sm font-medium text-ink-2 hover:bg-cream-alt"
          >
            Reset
          </button>
        )}
        {changed.length === 0 && !result && (
          <span className="text-xs text-ink-3">Move a slider to enable</span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded border border-risk-critical/30 bg-risk-criticalBg p-2.5 text-xs text-risk-critical">{error}</p>
      )}

      {result && (
        <div className="mt-5 rounded-lg border border-line bg-cream-alt p-4">
          {/* Side-by-side before/after — Design Brief §3 */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Now</p>
              <div className="mt-1">
                <RiskBadge
                  level={result.baseline.risk_class}
                  probability={result.baseline.probability}
                />
              </div>
            </div>
            <span className="text-lg text-ink-3" aria-hidden>
              →
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
                Scenario
              </p>
              <div className="mt-1">
                <RiskBadge
                  level={result.scenario.risk_class}
                  probability={result.scenario.probability}
                />
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
                Change
              </p>
              <p
                className={`font-mono text-sm font-semibold tabular-nums ${
                  result.probability_delta < 0 ? "text-risk-low" : "text-risk-critical"
                }`}
              >
                {result.probability_delta > 0 ? "+" : ""}
                {(result.probability_delta * 100).toFixed(1)} pts
              </p>
            </div>
          </div>

          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-2">
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
