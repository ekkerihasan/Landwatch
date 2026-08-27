from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import AuditLog, PredictionResult, Project, ProjectFlag, ShapExplanation, WhatIfScenario
from app.risk import current_features, score_project_auto as score_project
from app.schemas import FlagOut, FlagRequest, Prediction, ProjectDetailOut, ProjectOut, WhatIfRequest, WhatIfResponse

router = APIRouter(prefix="/projects", tags=["projects"])

RISK_ORDER = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}

SCENARIO_DISCLAIMER = (
    "Scenario only — a hypothetical re-score, not a prediction of what will happen "
    "and not a guarantee. No project record has been changed."
)


def _load(db: Session):
    """Projects with the relations the risk score needs, eagerly loaded."""
    return db.query(Project).options(
        selectinload(Project.stage_history),
        selectinload(Project.litigations),
        selectinload(Project.compensation_records),
    )


def _get_or_404(db: Session, project_id: int) -> Project:
    project = _load(db).filter(Project.project_id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project


def _persist_prediction(db: Session, project: Project, result: dict) -> PredictionResult:
    """Store a prediction and its factor breakdown for audit and trend display."""
    record = PredictionResult(
        project_id=project.project_id,
        model_version=result["model_version"],
        risk_class=result["risk_class"],
        probability=result["probability"],
        is_mock_prediction=result["is_mock_prediction"],
    )
    db.add(record)
    db.flush()
    for rank, factor in enumerate(result["factors"], start=1):
        db.add(
            ShapExplanation(
                prediction_id=record.id,
                feature_name=factor["feature"],
                feature_value=factor["value"],
                contribution_value=factor["contribution"],
                rank=rank,
                explanation=factor["explanation"],
            )
        )
    return record


def _audit(db: Session, action: str, entity_type: str, entity_id: int, details: dict) -> None:
    # user_id stays null until auth exists — the column is nullable for exactly that reason.
    db.add(AuditLog(action=action, entity_type=entity_type, entity_id=entity_id, details=details))


@router.get("", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    sector: Optional[str] = None,
    stage: Optional[str] = None,
    location: Optional[str] = None,
    sort: str = Query("risk", pattern="^(risk|created_at|name)$"),
):
    query = _load(db)
    if sector:
        query = query.filter(Project.sector == sector)
    if stage:
        query = query.filter(Project.current_stage == stage)
    if location:
        query = query.filter(Project.location == location)

    rows = [
        ProjectOut.model_validate({**p.__dict__, "prediction": score_project(p)})
        for p in query.all()
    ]

    if sort == "risk":
        rows.sort(key=lambda r: (RISK_ORDER[r.prediction.risk_class], r.prediction.probability), reverse=True)
    elif sort == "created_at":
        rows.sort(key=lambda r: r.created_at, reverse=True)
    else:
        rows.sort(key=lambda r: r.name)
    return rows


@router.get("/{project_id}", response_model=ProjectDetailOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = _get_or_404(db, project_id)
    return ProjectDetailOut.model_validate(
        {
            **project.__dict__,
            "prediction": score_project(project),
            "current_features": current_features(project),
            "stage_history": sorted(project.stage_history, key=lambda s: s.entered_at),
            "litigations": project.litigations,
            "compensation_records": project.compensation_records,
        }
    )


@router.get("/{project_id}/predict", response_model=Prediction)
def predict(project_id: int, db: Session = Depends(get_db)):
    """Current risk for one project (technicaldesign.md §3).

    Served by the interim rule in app/risk.py until the trained model lands.
    """
    project = _get_or_404(db, project_id)
    result = score_project(project)
    _persist_prediction(db, project, result)
    db.commit()
    return result


@router.get("/{project_id}/explain", response_model=List[dict])
def explain(project_id: int, db: Session = Depends(get_db)):
    """Top contributing factors behind the current prediction.

    Explainability-by-default (technicaldesign.md §5): no High/Critical score is
    shown without this. Returns rule contributions today, SHAP values later.
    """
    project = _get_or_404(db, project_id)
    return score_project(project)["factors"]


@router.post("/{project_id}/what-if", response_model=WhatIfResponse)
def what_if(project_id: int, payload: WhatIfRequest, db: Session = Depends(get_db)):
    """Re-score against modified features. Stored as a scenario, never as fact."""
    project = _get_or_404(db, project_id)
    overrides = payload.model_dump(exclude_none=True)
    if not overrides:
        raise HTTPException(status_code=400, detail="Provide at least one feature to modify")

    baseline = score_project(project)
    scenario = score_project(project, overrides=overrides)

    base_record = _persist_prediction(db, project, baseline)
    saved = WhatIfScenario(
        project_id=project.project_id,
        base_prediction_id=base_record.id,
        modified_features_json=overrides,
        resulting_risk_class=scenario["risk_class"],
        resulting_probability=scenario["probability"],
    )
    db.add(saved)
    db.flush()
    _audit(db, "what_if_run", "project", project.project_id, {
        "modified": overrides,
        "from": baseline["risk_class"],
        "to": scenario["risk_class"],
    })
    db.commit()

    return WhatIfResponse(
        scenario_id=saved.id,
        baseline=baseline,
        scenario=scenario,
        modified_features=overrides,
        probability_delta=round(scenario["probability"] - baseline["probability"], 4),
        disclaimer=SCENARIO_DISCLAIMER,
    )


@router.post("/{project_id}/flag", response_model=FlagOut, status_code=201)
def flag_project(project_id: int, payload: FlagRequest, db: Session = Depends(get_db)):
    """Flag for investigation, with the model's rationale attached (PRD §6)."""
    project = _get_or_404(db, project_id)
    result = score_project(project)
    prediction = _persist_prediction(db, project, result)

    flag = ProjectFlag(
        project_id=project.project_id,
        prediction_id=prediction.id,
        note=payload.note,
        status="open",
    )
    db.add(flag)
    db.flush()
    _audit(db, "flag_for_review", "project", project.project_id, {
        "risk_class": result["risk_class"],
        "probability": result["probability"],
        "top_factor": result["factors"][0]["feature"],
        "note": payload.note,
    })
    db.commit()
    db.refresh(flag)
    return flag


@router.get("/{project_id}/flags", response_model=List[FlagOut])
def list_flags(project_id: int, db: Session = Depends(get_db)):
    _get_or_404(db, project_id)
    return (
        db.query(ProjectFlag)
        .filter(ProjectFlag.project_id == project_id)
        .order_by(ProjectFlag.created_at.desc())
        .all()
    )
