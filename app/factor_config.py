"""Factor phrasing and recommendation rules — the deterministic layer.

Deliberately NOT machine-learned. The prediction layer is learned and probabilistic;
this layer is a lookup table a domain reviewer can read, argue with, and correct
without retraining anything. Being able to say "the recommendation layer is
deterministic and auditable, the prediction layer is learned" is a cleaner story
than "the model recommends things" — and it is the honest description.

Nothing in the dataset predicts "assign an additional field officer". That is an
administrative response to a condition, and it belongs here.
"""

# --- Display names ------------------------------------------------------------

FEATURE_LABELS = {
    "compensation_pct": "Compensation disbursed",
    "rehabilitation_progress_pct": "Rehabilitation progress",
    "open_litigations": "Unresolved litigation",
    "resolved_litigations": "Resolved litigation",
    "stage_overrun_ratio": "Schedule overrun",
    "days_in_current_stage": "Time in current stage",
    "prior_stage_avg_days": "Pace of earlier stages",
    "paf_count": "Families affected",
    "area": "Land area",
    "stage_index": "Stage reached",
    "current_stage": "Current legal stage",
}

# --- Phrasing templates -------------------------------------------------------
# One place, so the wording is deterministic and no language model is needed at
# inference time. `v` is the raw feature value; `stage` is the project's stage.

FEATURE_PHRASES = {
    "compensation_pct": lambda v, stage: f"Compensation pending for {100 - v:.0f}% of affected families.",
    "rehabilitation_progress_pct": lambda v, stage: (
        f"Rehabilitation plan progress at {v:.0f}%."
        if v >= 50 else f"Rehabilitation plan progress below 50% (at {v:.0f}%)."
    ),
    "open_litigations": lambda v, stage: (
        "No unresolved legal disputes." if v == 0
        else f"{v:.0f} unresolved legal dispute{'s' if v != 1 else ''}."
    ),
    "resolved_litigations": lambda v, stage: f"{v:.0f} dispute{'s' if v != 1 else ''} already resolved.",
    "stage_overrun_ratio": lambda v, stage: (
        f"{stage} stage is at {v:.1f}x its expected duration."
        if v > 1 else f"{stage} stage is within its expected duration."
    ),
    "days_in_current_stage": lambda v, stage: f"{v:.0f} days in the {stage} stage.",
    "prior_stage_avg_days": lambda v, stage: f"Earlier stages averaged {v:.0f} days each.",
    "paf_count": lambda v, stage: f"{v:.0f} project-affected families.",
    "area": lambda v, stage: f"{v:.0f} hectares under acquisition.",
    "stage_index": lambda v, stage: f"Currently at stage {stage}.",
    "current_stage": lambda v, stage: f"Currently at stage {stage}.",
}


def phrase_for(feature: str, value: float, stage: str) -> str:
    template = FEATURE_PHRASES.get(feature)
    if template is None:
        return f"{FEATURE_LABELS.get(feature, feature)}: {value}"
    return template(value, stage)


# --- Recommendation rules -----------------------------------------------------
# Each rule maps a measurable condition to an administrative action. `severity`
# orders them; `owner` says who the action belongs to, because a recommendation
# nobody owns is not actionable.

RECOMMENDATION_RULES = [
    {
        "id": "compensation_verification",
        "feature": "compensation_pct",
        "test": lambda v: v < 50,
        "action": "Prioritise compensation verification",
        "detail": "Disbursement is the single input an officer can move most directly. "
                  "Verify the beneficiary list and release blocked payments first.",
        "owner": "Competent Authority (LA)",
        "severity": 1,
    },
    {
        "id": "compensation_followup",
        "feature": "compensation_pct",
        "test": lambda v: 50 <= v < 75,
        "action": "Follow up on outstanding compensation",
        "detail": "Most of the award is disbursed. Identify the remaining beneficiaries "
                  "before the balance becomes the reason the stage cannot close.",
        "owner": "Competent Authority (LA)",
        "severity": 3,
    },
    {
        "id": "legal_escalation",
        "feature": "open_litigations",
        "test": lambda v: v >= 3,
        "action": "Escalate unresolved cases to the legal cell",
        "detail": "Three or more open disputes rarely clear through routine follow-up. "
                  "Consolidate them and hand the set to the legal cell.",
        "owner": "Legal cell",
        "severity": 1,
    },
    {
        "id": "legal_review",
        "feature": "open_litigations",
        "test": lambda v: v in (1, 2),
        "action": "Review open disputes before they multiply",
        "detail": "A small number of cases is still tractable. Check whether they share "
                  "a cause that can be settled once rather than case by case.",
        "owner": "Competent Authority (LA)",
        "severity": 3,
    },
    {
        "id": "field_officer",
        "feature": "stage_overrun_ratio",
        "test": lambda v: v >= 2.0,
        "action": "Assign an additional field officer",
        "detail": "The stage is running at twice its expected duration or worse. "
                  "Added field capacity is the usual remedy for a stalled survey or "
                  "an incomplete record of rights.",
        "owner": "Nodal officer",
        "severity": 2,
    },
    {
        "id": "schedule_check",
        "feature": "stage_overrun_ratio",
        "test": lambda v: 1.25 <= v < 2.0,
        "action": "Establish why the stage has not closed",
        "detail": "Past its expected duration but not yet critical. Identify the "
                  "blocking item while it is still a single item.",
        "owner": "Competent Authority (LA)",
        "severity": 3,
    },
    {
        "id": "rehabilitation_lag",
        "feature": "rehabilitation_progress_pct",
        "test": lambda v: v < 50,
        "action": "Accelerate the rehabilitation plan",
        "detail": "R&R progress below half. Possession cannot follow compensation while "
                  "resettlement is outstanding, so this blocks the final stages "
                  "regardless of how the award is progressing.",
        "owner": "R&R administrator",
        "severity": 2,
    },
    {
        "id": "large_displacement",
        "feature": "paf_count",
        "test": lambda v: v >= 400,
        "action": "Convene a rehabilitation coordination meeting",
        "detail": "Displacement on this scale needs the rehabilitation and resettlement "
                  "process running in parallel, not after acquisition completes.",
        "owner": "R&R administrator",
        "severity": 3,
    },
]

# Fires when several factors are simultaneously pushing risk up — the situation no
# single-factor rule describes.
COMPOUND_RULE = {
    "id": "district_review",
    "action": "Schedule a district-level review within seven days",
    "detail": "Several factors are raising risk at once. Individual follow-ups are "
              "unlikely to be enough; this needs a single review with all parties present.",
    "owner": "District Collector",
    "severity": 1,
}

# How many risk-raising factors must be present before the compound rule fires.
COMPOUND_THRESHOLD = 2

# Risk classes at which the compound rule is eligible at all.
COMPOUND_RISK_CLASSES = ("High", "Critical")


def recommend(features: dict, factors: list, risk_class: str) -> list:
    """Map the current condition to administrative actions.

    `factors` is the ranked explanation list, used only to decide whether enough
    separate things are going wrong to warrant a district-level review.
    """
    out = []
    for rule in RECOMMENDATION_RULES:
        value = features.get(rule["feature"])
        if value is None:
            continue
        try:
            if rule["test"](float(value)):
                out.append({
                    "id": rule["id"],
                    "action": rule["action"],
                    "detail": rule["detail"],
                    "owner": rule["owner"],
                    "severity": rule["severity"],
                    "triggered_by": rule["feature"],
                })
        except (TypeError, ValueError):
            continue

    # A review is warranted when several distinct factors are pushing risk up.
    raising = [f for f in factors if f.get("contribution", 0) > 0.05]
    if len(raising) >= COMPOUND_THRESHOLD and risk_class in COMPOUND_RISK_CLASSES:
        out.append({**COMPOUND_RULE, "triggered_by": "multiple_factors"})

    out.sort(key=lambda r: r["severity"])
    return out
