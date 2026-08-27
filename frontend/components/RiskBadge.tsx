import type { RiskLevel } from "@/lib/types";

// Risk is the only saturated colour family in the interface, so severity is what
// draws the eye. Design Brief §2.
const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "bg-risk-lowBg text-risk-low ring-risk-low/20",
  Medium: "bg-risk-mediumBg text-risk-medium ring-risk-medium/20",
  High: "bg-risk-highBg text-risk-high ring-risk-high/25",
  Critical: "bg-risk-criticalBg text-risk-critical ring-risk-critical/25",
};

const RISK_DOT: Record<RiskLevel, string> = {
  Low: "bg-risk-low",
  Medium: "bg-risk-medium",
  High: "bg-risk-high",
  Critical: "bg-risk-critical",
};

export const RISK_ORDER: Record<RiskLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function RiskBadge({ level, probability }: { level: RiskLevel; probability?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${RISK_STYLES[level]}`}
      aria-label={`Risk level: ${level}${
        probability != null ? `, ${Math.round(probability * 100)} percent` : ""
      }`}
    >
      {/* Colour is never the only signal — the dot and the word carry it too */}
      <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOT[level]}`} aria-hidden />
      {level}
      {probability != null && (
        <span className="lw-nums font-bold normal-case">{Math.round(probability * 100)}%</span>
      )}
    </span>
  );
}
