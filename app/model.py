"""Load the trained model and serve predictions with SHAP explanations.

Falls back to the rule in app/risk.py when no artifact is present, so the API works
on a fresh clone before anyone has run `python -m ml.train`.
"""
import os

import joblib
import numpy as np
import pandas as pd

ARTIFACT_PATH = os.getenv("MODEL_ARTIFACT", "ml/artifacts/model.joblib")

from app.stages import STAGE_EXPECTED_DAYS, STAGE_SEQUENCE  # noqa: F401

# Phrasing and recommendation rules live in one reviewable config (V2 contract, Gaps 2-3).
from app.factor_config import phrase_for, recommend  # noqa: E402

_artifact = None
_load_attempted = False


def load_artifact():
    """Load once, lazily. Returns None when no model has been trained yet."""
    global _artifact, _load_attempted
    if _load_attempted:
        return _artifact
    _load_attempted = True
    if os.path.exists(ARTIFACT_PATH):
        _artifact = joblib.load(ARTIFACT_PATH)
    return _artifact


def is_available() -> bool:
    return load_artifact() is not None


def extract_features(project) -> dict:
    """Build the model's feature row from a Project ORM object.

    Must produce exactly the columns ml/train.py trained on.
    """
    from app.risk import (
        NEUTRAL_COMPENSATION_PCT,
        NEUTRAL_REHABILITATION_PCT,
        days_in_current_stage,
        latest_compensation_pct,
        open_litigation_count,
    )

    stage = project.current_stage
    stage_index = STAGE_SEQUENCE.index(stage) if stage in STAGE_SEQUENCE else 0
    days = days_in_current_stage(project)
    expected = STAGE_EXPECTED_DAYS.get(stage, 90)

    closed = [s for s in project.stage_history if s.exited_at is not None]
    prior_avg = (
        sum((s.exited_at - s.entered_at).days for s in closed) / len(closed) if closed else 0.0
    )

    return {
        "paf_count": float(project.paf_count or 0),
        "area": float(project.area or 0),
        "open_litigations": float(open_litigation_count(project)),
        "resolved_litigations": float(
            sum(1 for lit in project.litigations if lit.status != "pending")
        ),
        "compensation_pct": float(
            NEUTRAL_COMPENSATION_PCT if latest_compensation_pct(project) is None
            else latest_compensation_pct(project)
        ),
        "days_in_current_stage": float(days),
        "prior_stage_avg_days": float(round(prior_avg, 1)),
        "stage_overrun_ratio": float(round(days / expected, 3)) if expected else 0.0,
        "rehabilitation_progress_pct": float(
            NEUTRAL_REHABILITATION_PCT
            if getattr(project, "rehabilitation_progress_pct", None) is None
            else project.rehabilitation_progress_pct
        ),
        "stage_index": float(stage_index),
        "current_stage": stage,
    }


def _risk_class(probability: float) -> str:
    if probability < 0.25:
        return "Low"
    if probability < 0.50:
        return "Medium"
    if probability < 0.75:
        return "High"
    return "Critical"


def _collapse_shap(shap_row, encoded_names, features: dict) -> list:
    """Map encoded feature contributions back to the original columns.

    One-hot columns for the same source feature are summed, so the officer sees
    "current stage" once rather than six near-zero dummies.
    """
    totals: dict[str, float] = {}
    for name, value in zip(encoded_names, shap_row):
        # ColumnTransformer names look like "num__compensation_pct" / "cat__current_stage_3G"
        bare = name.split("__", 1)[-1]
        source = next((f for f in features if bare == f or bare.startswith(f + "_")), bare)
        totals[source] = totals.get(source, 0.0) + float(value)
    return totals


def predict_delay_days(artifact, row) -> dict:
    """Predicted overrun in days, as a range. A point estimate to the day from a
    model trained on synthetic data is the least defensible number we could show."""
    regressors = artifact.get("regressors")
    if not regressors:
        return None
    lower = max(float(regressors["lower"].predict(row)[0]), 0.0)
    median = max(float(regressors["median"].predict(row)[0]), 0.0)
    upper = max(float(regressors["upper"].predict(row)[0]), 0.0)
    # Quantile models are fitted independently and can cross on unusual inputs.
    lower, median, upper = sorted([lower, median, upper])
    metrics = artifact.get("regression_metrics", {})
    return {
        "lower_days": int(round(lower)),
        "median_days": int(round(median)),
        "upper_days": int(round(upper)),
        "mae_days": metrics.get("mae_days"),
        "interval_coverage": metrics.get("interval_coverage"),
    }


def predict(project) -> dict:
    """Risk class, probability and SHAP factors for one project."""
    artifact = load_artifact()
    if artifact is None:
        raise RuntimeError("No trained model artifact — run `python -m ml.train`")

    features = extract_features(project)
    row = pd.DataFrame([features])[artifact["features"]]

    pipeline = artifact["pipeline"]
    # Clamped so the card can never read 100%. The model is trained on synthetic data;
    # displaying certainty would be the least defensible thing on the screen.
    probability = min(float(pipeline.predict_proba(row)[0, 1]), 0.99)

    # The deployed pipeline is the calibration wrapper; SHAP explains the estimator
    # underneath it. The calibrator only rescales the output, so the attributions hold.
    shap_pipeline = artifact.get("shap_pipeline", pipeline)
    prep = shap_pipeline.named_steps["prep"]
    transformed = prep.transform(row)
    shap_values = artifact["explainer"](transformed)
    values = np.asarray(shap_values.values)[0]
    # Binary classifiers can return (n_features, 2) — keep the delayed-class column.
    if values.ndim > 1:
        values = values[:, -1]

    totals = _collapse_shap(values, artifact["feature_names_out"], features)

    stage = project.current_stage
    factors = []
    for name, contribution in totals.items():
        raw = features.get(name, 0)
        numeric = float(raw) if isinstance(raw, (int, float)) else 0.0
        factors.append({
            "feature": name,
            "value": numeric,
            "contribution": round(float(contribution), 4),
            "explanation": phrase_for(name, numeric, stage),
        })

    # Rank by absolute impact, but keep the sign — SHAP factors can lower risk too.
    factors.sort(key=lambda f: abs(f["contribution"]), reverse=True)

    from app.risk import missing_inputs

    risk_class = _risk_class(probability)
    top_factors = factors[:6]
    return {
        "risk_class": risk_class,
        "probability": round(probability, 4),
        "factors": top_factors,
        "model_version": artifact["model_version"],
        "is_mock_prediction": False,
        "missing_inputs": missing_inputs(project),
        "recommendations": recommend(features, top_factors, risk_class),
        "delay_estimate": predict_delay_days(artifact, row),
    }
