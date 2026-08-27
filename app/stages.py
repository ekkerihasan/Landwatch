"""The statutory stage sequence and its expected durations — the single source.

SOURCE: NHAI Circular No. 7.1.83/2025 dated 9 April 2025, which publishes an
eight-stage land-acquisition timeline totalling 336 days, plus the 21-day objection
period fixed by section 3C of the National Highways Act, 1956.

These durations are NOT invented. An earlier version of this file used made-up
numbers totalling 465 days to possession; the published framework allows 306. Every
"days behind baseline" figure and the entire delay label derive from these values, so
the difference mattered.

How the circular's eight stages map onto the six statutory sections we track:

    Circular stage                                   Days   Cumulative   Our stage
    1  Draft 3A submitted to Competent Authority        1        1       3A
    2  3A published (e-Gazette, newspapers)            21       21       3A
       [s.3C objection window, inside the 3A->3D span] 21        -       3C
    3  3D published, ROW agency engaged             60-90      111       3D
    4  Award declaration (notice, valuation)           90      201       3G
    5  Award verification and approval                  5      206       3G
    6  Fund deposit and disbursement                   10      216       3H
    7  Possession notice, ROW mobilisation          15-90      306       3E
    8  Land mutation                                   30      336       (post-possession)

So 3A = 21, 3C = 21 (statutory objection period), 3D = 69 (the balance of the
90-day 3A->3D window), 3G = 95 (stages 4+5), 3H = 10, 3E = 90.
Total to possession = 306, which reconciles exactly with the circular.

Where a range is published we take the longer figure (90 days for Cabinet-approval
cases, 90 days for possession), because a baseline that is too tight would flag
ordinary projects as delayed.

STILL FOR DOMAIN REVIEW: whether NHAI's *target* timeline is the right baseline for
a *delay* label at all. A target that is routinely missed in practice makes almost
everything look delayed. See phase0_decisions.md.

The frontend holds no copy: the API sends `expected_days` and `days_vs_baseline` on
each stage row.
"""

STAGE_SEQUENCE = ["3A", "3C", "3D", "3G", "3H", "3E"]

# Days allowed per stage, derived from the circular as traced above.
STAGE_EXPECTED_DAYS = {
    "3A": 21,   # draft + publication of the 3A notification
    "3C": 21,   # objection period fixed by s.3C, NH Act 1956
    "3D": 69,   # balance of the 90-day 3A->3D window
    "3G": 95,   # award declaration (90) + verification and approval (5)
    "3H": 10,   # fund deposit and disbursement
    "3E": 90,   # possession notice and ROW mobilisation
}

STAGE_LABELS = {
    "3A": "Notification of intent",
    "3C": "Objections heard",
    "3D": "Declaration — land vests",
    "3G": "Compensation determined",
    "3H": "Compensation deposited",
    "3E": "Possession taken",
}

# Provenance, surfaced through /admin/model so the number on screen is traceable.
BASELINE_SOURCE = {
    "authority": "NHAI Circular No. 7.1.83/2025",
    "dated": "2025-04-09",
    "statute": "National Highways Act, 1956 (ss. 3A, 3C, 3D, 3G, 3H)",
    "total_days_to_possession": 306,
    "note": (
        "NHAI's published target timeline. It is a target, not observed practice — "
        "whether it is the right baseline for a delay label is still for domain review."
    ),
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
