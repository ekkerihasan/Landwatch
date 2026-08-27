import type { Project, RiskLevel } from "@/lib/types";

const ORDER: RiskLevel[] = ["Critical", "High", "Medium", "Low"];

const COLOUR: Record<RiskLevel, string> = {
  Critical: "#9e2a20",
  High: "#b3561d",
  Medium: "#97690d",
  Low: "#1f7a5c",
};

/**
 * Risk distribution as a donut.
 *
 * Hand-drawn with SVG stroke-dasharray rather than a charting library — one ring of
 * four segments does not justify a dependency, and this keeps the bundle as it was.
 */
export function RiskOverview({ projects }: { projects: Project[] }) {
  const counts = ORDER.map((level) => ({
    level,
    count: projects.filter((p) => p.prediction.risk_class === level).length,
  }));
  const total = projects.length || 1;

  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="rounded-card border border-line bg-cream-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Risk overview</h2>
      <p className="mt-0.5 text-xs text-ink-3">Distribution across the portfolio</p>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div className="relative shrink-0">
          <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#eae4d8" strokeWidth="16" />
            {counts.map(({ level, count }) => {
              if (count === 0) return null;
              const len = (count / total) * C;
              const seg = (
                <circle
                  key={level}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={COLOUR[level]}
                  strokeWidth="16"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return seg;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="lw-nums text-2xl font-bold text-forest-800">{projects.length}</span>
            <span className="text-[10px] uppercase tracking-wider text-ink-3">projects</span>
          </div>
        </div>

        <ul className="min-w-[9rem] flex-1 space-y-2">
          {counts.map(({ level, count }) => (
            <li key={level} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: COLOUR[level] }}
                aria-hidden
              />
              <span className="flex-1 text-xs text-ink-2">{level} risk</span>
              <span className="lw-nums text-sm font-semibold text-ink">{count}</span>
              <span className="lw-nums w-10 text-right text-[11px] text-ink-3">
                {Math.round((count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
