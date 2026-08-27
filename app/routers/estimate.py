"""Score a hypothetical project — the map view's "what would this site look like".

A project that has not started has none of the model's strongest signals: no stage
history, no litigation on file, nothing disbursed. So the officer supplies estimates
and we score those. The result is an estimate for a project WITH THESE
CHARACTERISTICS, never a prediction about a real record, and the response says so.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog
from app.schemas import NewProjectScoreRequest, NewProjectScoreResponse

router = APIRouter(prefix="/estimate", tags=["estimate"])

ESTIMATE_DISCLAIMER = (
    "Estimate for a project with these characteristics — not a prediction about a "
    "real project, and not a commitment. The inputs are the officer's own estimates; "
    "a project that has not started has no litigation, disbursement or stage history "
    "for the model to read."
)


@router.post("/new-project", response_model=NewProjectScoreResponse)
def score_new_project(payload: NewProjectScoreRequest, db: Session = Depends(get_db)):
    from app import model as trained_model
    from app.risk import STAGE_EXPECTED_DAYS, score_features

    stage = payload.current_stage
    expected = STAGE_EXPECTED_DAYS.get(stage, 90)

    if trained_model.is_available():
        import pandas as pd

        artifact = trained_model.load_artifact()
        features = {
            "paf_count": float(payload.paf_count),
            "area": float(payload.area),
            "open_litigations": float(payload.expected_litigations),
            "resolved_litigations": 0.0,
            "compensation_pct": float(payload.planned_compensation_pct),
            "prior_stage_avg_days": 0.0,  # nothing completed yet
            "stage_overrun_ratio": round(payload.days_in_current_stage / expected, 3)
            if expected
            else 0.0,
            "stage_index": float(["3A", "3C", "3D", "3G", "3H", "3E"].index(stage))
            if stage in ["3A", "3C", "3D", "3G", "3H", "3E"]
            else 0.0,
            "current_stage": stage,
        }
        row = pd.DataFrame([features])[artifact["features"]]
        probability = float(artifact["pipeline"].predict_proba(row)[0, 1])

        # Reuse the trained explainer so the factor list matches the dashboard's.
        prep = artifact["pipeline"].named_steps["prep"]
        import numpy as np

        shap_values = artifact["explainer"](prep.transform(row))
        values = np.asarray(shap_values.values)[0]
        if values.ndim > 1:
            values = values[:, -1]
        totals = trained_model._collapse_shap(values, artifact["feature_names_out"], features)

        factors = []
        for name, contribution in totals.items():
            raw = features.get(name, 0)
            phrase = trained_model.FEATURE_PHRASES.get(name)
            factors.append({
                "feature": name,
                "value": float(raw) if isinstance(raw, (int, float)) else 0.0,
                "contribution": round(float(contribution), 4),
                "explanation": phrase(float(raw))
                if phrase and isinstance(raw, (int, float))
                else f"{name.replace('_', ' ').capitalize()}: {raw}",
            })
        factors.sort(key=lambda f: abs(f["contribution"]), reverse=True)

        prediction = {
            "risk_class": trained_model._risk_class(probability),
            "probability": round(probability, 4),
            "factors": factors[:6],
            "model_version": artifact["model_version"],
            "is_mock_prediction": False,
        }
    else:
        prediction = score_features(
            {
                "days_in_current_stage": payload.days_in_current_stage,
                "open_litigations": payload.expected_litigations,
                "compensation_pct": payload.planned_compensation_pct,
            },
            stage,
        )

    inputs = payload.model_dump()
    db.add(
        AuditLog(
            action="estimate_new_project",
            entity_type="estimate",
            entity_id=None,
            details={"location": payload.location, "risk_class": prediction["risk_class"]},
        )
    )
    db.commit()

    return NewProjectScoreResponse(
        prediction=prediction,
        inputs=inputs,
        disclaimer=ESTIMATE_DISCLAIMER,
    )
