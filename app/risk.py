"""Interim rule-based risk scoring.

PLACEHOLDER — this stands in for the trained model until it lands. Because it is a
plain weighted rule, its factor breakdown is exact by construction, not estimated.
When XGBoost arrives, replace `score_features` and swap the returned `factors` for
SHAP values; the return shape and every caller stay unchanged.
"""
from datetime import datetime, timezone

from app.factor_config import recommend

# Rough statutory/expected days per stage — placeholder until the mentor confirms
# the delay-label definition (prd.md §9).
STAGE_EXPECTED_DAYS = {"3A": 60, "3C": 90, "3D": 120, "3G": 90, "3H": 60, "3E": 45}

WEIGHT_STAGE_OVERRUN = 0.45
WEIGHT_LITIGATION = 0.30
WEIGHT_COMPENSATION = 0.25

MODEL_VERSION = "rule-based-placeholder-v0"

# The only inputs an officer can realistically move (prd.md §9). The what-if
# simulator exposes exactly these.
ACTIONABLE_FEATURES = ("days_in_current_stage", "open_litigations", "compensation_pct")


def days_in_current_stage(project) -> int:
    """Days since the project entered its current stage (0 if unknown)."""
    open_stage = next(
        (s for s in project.stage_history if s.exited_at is None and s.stage == project.current_stage),
        None,
    )
    if open_stage is None:
        return 0
    return max((datetime.now(timezone.utc) - open_stage.entered_at).days, 0)


# Median compensation in the training set. Used when a project has NO compensation
# record at all — "not recorded yet" is not the same as "nothing disbursed", and
# scoring absence as 0% makes every newly created project look Critical.
NEUTRAL_COMPENSATION_PCT = 58.0


def latest_compensation_pct(project):
    """Most recent compensation percentage, or None when nothing is recorded."""
    if not project.compensation_records:
        return None
    return max(project.compensation_records, key=lambda c: c.updated_at).compensation_pct


def open_litigation_count(project) -> int:
    return sum(1 for lit in project.litigations if lit.status == "pending")


def missing_inputs(project) -> list:
    """Inputs the model needs that this project has no data for."""
    missing = []
    if latest_compensation_pct(project) is None:
        missing.append("compensation_pct")
    if not project.stage_history:
        missing.append("days_in_current_stage")
    return missing


def current_features(project) -> dict:
    """The feature vector as it stands today — the what-if baseline."""
    compensation = latest_compensation_pct(project)
    return {
        "days_in_current_stage": days_in_current_stage(project),
        "open_litigations": open_litigation_count(project),
        "compensation_pct": NEUTRAL_COMPENSATION_PCT if compensation is None else compensation,
    }


def score_features(features: dict, stage: str) -> dict:
    """Score one feature vector. Swap this body for the trained model."""
    days = max(float(features.get("days_in_current_stage", 0)), 0.0)
    litigations = max(float(features.get("open_litigations", 0)), 0.0)
    compensation = min(max(float(features.get("compensation_pct", 0)), 0.0), 100.0)
    expected = STAGE_EXPECTED_DAYS.get(stage, 90)

    # Each component is normalised to 0..1, then weighted.
    overrun = min(days / expected / 2, 1.0) if expected else 0.0
    litigation_load = min(litigations / 3, 1.0)
    compensation_gap = max(0.0, (100 - compensation) / 100)

    factors = [
        {
            "feature": "days_in_current_stage",
            "value": days,
            "contribution": round(overrun * WEIGHT_STAGE_OVERRUN, 4),
            "explanation": f"{days:.0f} days in stage {stage} (expected ~{expected})",
        },
        {
            "feature": "open_litigations",
            "value": litigations,
            "contribution": round(litigation_load * WEIGHT_LITIGATION, 4),
            "explanation": f"{litigations:.0f} unresolved litigation case(s)",
        },
        {
            "feature": "compensation_pct",
            "value": compensation,
            "contribution": round(compensation_gap * WEIGHT_COMPENSATION, 4),
            "explanation": f"{compensation:.0f}% of compensation disbursed",
        },
    ]
    factors.sort(key=lambda f: f["contribution"], reverse=True)

    probability = min(max(sum(f["contribution"] for f in factors), 0.01), 0.99)

    if probability < 0.25:
        risk_class = "Low"
    elif probability < 0.50:
        risk_class = "Medium"
    elif probability < 0.75:
        risk_class = "High"
    else:
        risk_class = "Critical"

    return {
        "risk_class": risk_class,
        "probability": round(probability, 4),
        "factors": factors,
        "model_version": MODEL_VERSION,
        "is_mock_prediction": True,
        "missing_inputs": [],
        "recommendations": recommend(
            {
                "compensation_pct": compensation,
                "open_litigations": litigations,
                "stage_overrun_ratio": round(days / expected, 3) if expected else 0.0,
            },
            factors,
            risk_class,
        ),
    }


def score_project(project, overrides: dict | None = None) -> dict:
    """Score a project, optionally with what-if overrides applied to its features."""
    features = current_features(project)
    if overrides:
        features.update({k: v for k, v in overrides.items() if k in features and v is not None})
    return score_features(features, project.current_stage)


def score_project_auto(project, overrides: dict | None = None) -> dict:
    """Preferred entry point: trained model when one exists, interim rule otherwise.

    What-if overrides apply to either path — the model re-scores a modified feature
    row exactly as the rule re-scores modified inputs.
    """
    from app import model as trained_model

    if not trained_model.is_available():
        return score_project(project, overrides=overrides)

    if not overrides:
        return trained_model.predict(project)

    # Apply overrides on top of the model's feature row, then re-score.
    import pandas as pd

    artifact = trained_model.load_artifact()
    features = trained_model.extract_features(project)
    for key, value in overrides.items():
        if key in features and value is not None:
            features[key] = float(value)
    # Keep derived features consistent with the overridden days-in-stage.
    expected = STAGE_EXPECTED_DAYS.get(project.current_stage, 90)
    if expected:
        features["stage_overrun_ratio"] = round(features["days_in_current_stage"] / expected, 3)

    row = pd.DataFrame([features])[artifact["features"]]
    probability = float(artifact["pipeline"].predict_proba(row)[0, 1])
    base = trained_model.predict(project)
    base["risk_class"] = trained_model._risk_class(probability)
    base["probability"] = round(probability, 4)
    return base
