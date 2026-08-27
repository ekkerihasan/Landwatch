"""Score a hypothetical project — the map view's "what would this site look like".

A project that has not started has none of the model's strongest signals: no stage
history, no litigation on file, nothing disbursed. Anything the officer leaves blank
gets a typical value, named in `assumed_inputs`, so a location alone still returns
something honest rather than nothing.

Note what this endpoint does NOT do: it does not use the location. The model has no
location feature, and in the synthetic training data `state` is drawn at random with
no effect on the outcome. Scoring by region would be inventing a regional claim from
noise. The coordinates are stored so the site can be found again, nothing more.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog
from app.schemas import NewProjectScoreRequest, NewProjectScoreResponse

router = APIRouter(prefix="/estimate", tags=["estimate"])

# Typical values, from the training distribution. Used only when a field is blank.
TYPICAL = {
    "area": 60.0,
    "paf_count": 133,          # training median
    "days_in_current_stage": 0.0,
    "expected_litigations": 1.0,  # training median
    "planned_compensation_pct": 58.0,  # training median; NOT 0, which reads as worst case
}

ESTIMATE_DISCLAIMER = (
    "Estimate for a project with these characteristics — not a prediction about a "
    "real project, and not a commitment. The location is recorded but not used in "
    "scoring: the model has no location feature, so this says nothing about this "
    "district specifically."
)


@router.post("/new-project", response_model=NewProjectScoreResponse)
def score_new_project(payload: NewProjectScoreRequest, db: Session = Depends(get_db)):
    from app import model as trained_model
    from app.factor_config import phrase_for, recommend
    from app.risk import STAGE_EXPECTED_DAYS, score_features

    stage = payload.current_stage
    expected = STAGE_EXPECTED_DAYS.get(stage, 90)

    # Fill blanks with typical values and record which ones we filled.
    supplied = payload.model_dump()
    assumed = []
    values = {}
    for key, fallback in TYPICAL.items():
        given = supplied.get(key)
        if given is None:
            values[key] = fallback
            assumed.append(key)
        else:
            values[key] = given

    if trained_model.is_available():
        import numpy as np
        import pandas as pd

        artifact = trained_model.load_artifact()
        features = {
            "paf_count": float(values["paf_count"]),
            "area": float(values["area"]),
            "open_litigations": float(values["expected_litigations"]),
            "resolved_litigations": 0.0,
            "compensation_pct": float(values["planned_compensation_pct"]),
            "prior_stage_avg_days": 0.0,  # nothing completed yet
            "stage_overrun_ratio": round(values["days_in_current_stage"] / expected, 3)
            if expected
            else 0.0,
            "stage_index": float(list(STAGE_EXPECTED_DAYS).index(stage))
            if stage in STAGE_EXPECTED_DAYS
            else 0.0,
            "current_stage": stage,
        }
        row = pd.DataFrame([features])[artifact["features"]]
        probability = float(artifact["pipeline"].predict_proba(row)[0, 1])

        prep = artifact["pipeline"].named_steps["prep"]
        shap_values = artifact["explainer"](prep.transform(row))
        raw_values = np.asarray(shap_values.values)[0]
        if raw_values.ndim > 1:
            raw_values = raw_values[:, -1]
        totals = trained_model._collapse_shap(
            raw_values, artifact["feature_names_out"], features
        )

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
        factors.sort(key=lambda f: abs(f["contribution"]), reverse=True)

        risk_class = trained_model._risk_class(probability)
        top = factors[:6]
        prediction = {
            "risk_class": risk_class,
            "probability": round(probability, 4),
            "factors": top,
            "model_version": artifact["model_version"],
            "is_mock_prediction": False,
            "missing_inputs": assumed,
            "recommendations": recommend(features, top, risk_class),
        }
    else:
        prediction = score_features(
            {
                "days_in_current_stage": values["days_in_current_stage"],
                "open_litigations": values["expected_litigations"],
                "compensation_pct": values["planned_compensation_pct"],
            },
            stage,
        )
        prediction["missing_inputs"] = assumed

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
        inputs={**supplied, "resolved": values},
        assumed_inputs=assumed,
        disclaimer=ESTIMATE_DISCLAIMER,
    )
