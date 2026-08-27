"""The statutory stage sequence and its expected durations — the single source.

These numbers were previously duplicated in four places (app/risk.py, app/model.py,
ml/delay_label.py and the frontend's StageTracker). They agreed by luck. Every
"days behind baseline" figure on the card is derived from them, so a drift between
copies would have shown the officer two different numbers for the same fact.

The frontend no longer holds a copy at all: the API sends `expected_days` and
`days_vs_baseline` on each stage row.

PROVISIONAL durations, pending domain sign-off (prd.md §9).
"""

STAGE_SEQUENCE = ["3A", "3C", "3D", "3G", "3H", "3E"]

STAGE_EXPECTED_DAYS = {
    "3A": 60,   # Notification of intent
    "3C": 90,   # Declaration
    "3D": 120,  # Land vests with the government
    "3G": 90,   # Compensation determined
    "3H": 60,   # Compensation deposited
    "3E": 45,   # Possession taken
}

STAGE_LABELS = {
    "3A": "Notification of intent",
    "3C": "Declaration",
    "3D": "Land vests",
    "3G": "Compensation determined",
    "3H": "Compensation deposited",
    "3E": "Possession taken",
}

DEFAULT_EXPECTED_DAYS = 90


def expected_days(stage: str) -> int:
    return STAGE_EXPECTED_DAYS.get(stage, DEFAULT_EXPECTED_DAYS)


def stage_index(stage: str) -> int:
    return STAGE_SEQUENCE.index(stage) if stage in STAGE_SEQUENCE else 0


def expected_total_days(stage: str) -> int:
    """Statutory days a project should have needed to reach the end of `stage`."""
    return sum(expected_days(s) for s in STAGE_SEQUENCE[: stage_index(stage) + 1])


def days_vs_baseline(stage: str, days_in_stage: float) -> int:
    """Days ahead of (negative) or behind (positive) the stage's expected duration.

    This is the card's "Approval stage already 24 days behind baseline".
    """
    return int(round(days_in_stage - expected_days(stage)))
