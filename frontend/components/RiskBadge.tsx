import type { RiskLevel } from "@/lib/types";

// Design Brief §2 — Risk colour coding (consistent everywhere)
const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "bg-teal-100 text-teal-800 ring-teal-600/20",
  Medium: "bg-amber-100 text-amber-800 ring-amber-600/20",
  High: "bg-orange-100 text-orange-800 ring-orange-600/20",
  Critical: "bg-red-100 text-red-800 ring-red-600/20",
};

const RISK_DOT: Record<RiskLevel, string> = {
  Low: "bg-teal-600",
  Medium: "bg-amber-600",
  High: "bg-orange-600",
  Critical: "bg-red-600",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${RISK_STYLES[level]}`}
      aria-label={`Risk level: ${level}${probability != null ? `, probability ${Math.round(probability * 100)}%` : ""}`}
    >
      {/* Color is never the only signal — add dot + text per Design Brief §4 */}
      <span className={`h-2 w-2 rounded-full ${RISK_DOT[level]}`} aria-hidden />
      {level}
      {probability != null && (
        <span className="font-normal opacity-70">{Math.round(probability * 100)}%</span>
      )}
    </span>
  );
}
