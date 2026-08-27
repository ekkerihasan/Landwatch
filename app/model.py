"""Load the trained model and serve predictions with SHAP explanations.

Falls back to the rule in app/risk.py when no artifact is present, so the API works
on a fresh clone before anyone has run `python -m ml.train`.
"""
import os

import joblib
import numpy as np
import pandas as pd

ARTIFACT_PATH = os.getenv("MODEL_ARTIFACT", "ml/artifacts/model.joblib")

STAGE_SEQUENCE = ["3A", "3C", "3D", "3G", "3H", "3E"]
STAGE_EXPECTED_DAYS = {"3A": 60, "3C": 90, "3D": 120, "3G": 90, "3H": 60, "3E": 45}

# Plain-language templates for the UI — Design Brief §3 asks for a one-liner per factor.
FEATURE_PHRASES = {
    "open_litigations": lambda v: f"{v:.0f} unresolved litigation case(s)",
    "resolved_litigations": lambda v: f"{v:.0f} litigation case(s) already resolved",
    "compensation_pct": lambda v: f"{v:.0f}% of compensation disbursed",
    "days_in_current_stage": lambda v: f"{v:.0f} days in the current stage",
    "stage_overrun_ratio": lambda v: f"Current stage is at {v:.1f}x its expected duration",
    "prior_stage_avg_days": lambda v: f"Earlier stages averaged {v:.0f} days each",
    "paf_count": lambda v: f"{v:.0f} project-affected families",
    "area": lambda v: f"{v:.0f} hectares under acquisition",
    "stage_index": lambda v: f"At stage {STAGE_SEQUENCE[int(v)] if 0 <= int(v) < 6 else '?'} of the sequence",
    "current_stage": lambda v: "Current legal stage",
}

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
    from app.risk import days_in_current_stage, latest_compensation_pct, open_litigation_count

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
        "compensation_pct": float(latest_compensation_pct(project)),
        "days_in_current_stage": float(days),
        "prior_stage_avg_days": float(round(prior_avg, 1)),
        "stage_overrun_ratio": float(round(days / expected, 3)) if expected else 0.0,
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


def predict(project) -> dict:
    """Risk class, probability and SHAP factors for one project."""
    artifact = load_artifact()
    if artifact is None:
        raise RuntimeError("No trained model artifact — run `python -m ml.train`")

    features = extract_features(project)
    row = pd.DataFrame([features])[artifact["features"]]

    pipeline = artifact["pipeline"]
    probability = float(pipeline.predict_proba(row)[0, 1])

    prep = pipeline.named_steps["prep"]
    transformed = prep.transform(row)
    shap_values = artifact["explainer"](transformed)
    values = np.asarray(shap_values.values)[0]
    # Binary classifiers can return (n_features, 2) — keep the delayed-class column.
    if values.ndim > 1:
        values = values[:, -1]

    totals = _collapse_shap(values, artifact["feature_names_out"], features)

    factors = []
    for name, contribution in totals.items():
        raw = features.get(name, 0)
        phrase = FEATURE_PHRASES.get(name)
        factors.append({
            "feature": name,
            "value": float(raw) if isinstance(raw, (int, float)) else 0.0,
            "contribution": round(float(contribution), 4),
            "explanation": phrase(float(raw)) if phrase and isinstance(raw, (int, float))
            else f"{name.replace('_', ' ').capitalize()}: {raw}",
        })

    # Rank by absolute impact, but keep the sign — SHAP factors can lower risk too.
    factors.sort(key=lambda f: abs(f["contribution"]), reverse=True)

    return {
        "risk_class": _risk_class(probability),
        "probability": round(probability, 4),
        "factors": factors[:6],
        "model_version": artifact["model_version"],
        "is_mock_prediction": False,
    }
