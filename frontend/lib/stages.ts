/**
 * Stage labels for display.
 *
 * These mirror the sections of the National Highways Act, 1956, as recorded in
 * app/stages.py. The DURATIONS deliberately live only on the server — the API sends
 * expected_days and days_vs_baseline per stage row, so there is no second copy to
 * drift out of step.
 *
 * Note there is no section 3B. The statutory sequence is 3A → 3C → 3D → 3G → 3H → 3E.
 */
export const STAGE_SEQUENCE = ["3A", "3C", "3D", "3G", "3H", "3E"] as const;

export const STAGE_LABELS: Record<string, string> = {
  "3A": "Notification of intent",
  "3C": "Objections heard",
  "3D": "Declaration — land vests",
  "3G": "Compensation determined",
  "3H": "Compensation deposited",
  "3E": "Possession taken",
};

/** Short form, for tight table cells and chips. */
export const STAGE_SHORT: Record<string, string> = {
  "3A": "Notification",
  "3C": "Objections",
  "3D": "Declaration",
  "3G": "Compensation",
  "3H": "Disbursement",
  "3E": "Possession",
};
