import type { Prediction } from "@/lib/types";

const TONE: Record<string, { bar: string; text: string; bg: string }> = {
  Low: { bar: "bg-risk-low", text: "text-risk-low", bg: "bg-risk-lowBg" },
  Medium: { bar: "bg-risk-medium", text: "text-risk-medium", bg: "bg-risk-mediumBg" },
  High: { bar: "bg-risk-high", text: "text-risk-high", bg: "bg-risk-highBg" },
  Critical: { bar: "bg-risk-critical", text: "text-risk-critical", bg: "bg-risk-criticalBg" },
};

/**
 * The verdict block: score, band and expected overrun, read at a glance.
 *
 * The delay is a RANGE. A point estimate to the day, from a model trained on
 * synthetic data, is the least defensible figure the system could put on screen.
 */
export function RiskVerdict({ prediction }: { prediction: Prediction }) {
  const tone = TONE[prediction.risk_class] ?? TONE.Low;
  const pct = Math.round(prediction.probability * 100);
  const delay = prediction.delay_estimate;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-cream-surface shadow-card">
      <div className="grid divide-y divide-line-soft sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {/* Score */}
        <div className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Overall delay risk
          </p>
          <div className="mt-2.5 flex items-baseline gap-3">
            <span className={`lw-nums text-5xl font-bold tracking-tight ${tone.text}`}>
              {pct}
              <span className="text-2xl">%</span>
            </span>
            <span
              className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${tone.bg} ${tone.text}`}
            >
              {prediction.risk_class}
            </span>
          </div>

          {/* Band indicator — position on the scale, not just a colour */}
          <div className="mt-4">
            <div className="relative h-2 overflow-hidden rounded-full bg-cream-deep">
              <div className={`h-full ${tone.bar}`} style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-ink-3">
              <span>Low</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Delay */}
        <div className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Predicted delay
          </p>
          {delay ? (
            <>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="lw-nums text-4xl font-bold tracking-tight text-ink">
                  {delay.lower_days}–{delay.upper_days}
                </span>
                <span className="text-sm font-medium text-ink-2">days</span>
              </div>
              <p className="mt-2 text-xs text-ink-2">
                Beyond the statutory baseline. Central estimate{" "}
                <span className="lw-nums font-semibold">{delay.median_days} days</span>.
              </p>
              <p className="mt-2.5 border-t border-line-soft pt-2.5 text-[11px] leading-relaxed text-ink-3">
                Shown as a range, not a single figure — the interval is what the model can
                actually support.
                {delay.mae_days != null && (
                  <> Typical error ±{Math.round(delay.mae_days)} days on held-out data.</>
                )}
              </p>
            </>
          ) : (
            <p className="mt-2.5 text-sm text-ink-3">
              No delay estimate available — the regressor has not been trained.
            </p>
          )}
        </div>
      </div>

      {prediction.missing_inputs.length > 0 && (
        <p className="border-t border-line bg-risk-mediumBg px-5 py-2.5 text-[11px] text-risk-medium">
          No data recorded for{" "}
          <span className="font-semibold">{prediction.missing_inputs.join(", ")}</span> — a
          neutral value was assumed, so treat this score as provisional.
        </p>
      )}
    </div>
  );
}
