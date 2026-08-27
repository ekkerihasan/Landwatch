"""Write endpoints for the core acquisition records.

Every write is audit-logged. There is no auth yet, so AuditLog.user_id stays null —
the column is nullable for exactly that reason.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import (
    AcquisitionStageHistory,
    AuditLog,
    CompensationRecord,
    Litigation,
    Project,
)
from app.schemas import (
    CompensationCreate,
    CompensationRecordOut,
    LitigationCreate,
    LitigationOut,
    LitigationUpdate,
    ProjectCreate,
    ProjectDetailOut,
    ProjectUpdate,
    StageAdvance,
    StageHistoryOut,
)

router = APIRouter(prefix="/projects", tags=["crud"])

STAGE_SEQUENCE = ["3A", "3C", "3D", "3G", "3H", "3E"]


def _audit(db: Session, action: str, entity_type: str, entity_id: int, details: dict) -> None:
    db.add(AuditLog(action=action, entity_type=entity_type, entity_id=entity_id, details=details))


def _load(db: Session):
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


def _detail(project: Project) -> ProjectDetailOut:
    from app.risk import current_features, score_project_auto

    return ProjectDetailOut.model_validate({
        **project.__dict__,
        "prediction": score_project_auto(project),
        "current_features": current_features(project),
        "stage_history": sorted(project.stage_history, key=lambda s: s.entered_at),
        "litigations": project.litigations,
        "compensation_records": project.compensation_records,
    })


@router.post("", response_model=ProjectDetailOut, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(**payload.model_dump())
    db.add(project)
    db.flush()

    # A new project starts with its current stage open, so time-in-stage is measurable
    # from day one. Without this the risk score has no timing signal at all.
    db.add(
        AcquisitionStageHistory(
            project_id=project.project_id,
            stage=project.current_stage,
            entered_at=datetime.now(timezone.utc),
        )
    )
    _audit(db, "create_project", "project", project.project_id, {"name": project.name})
    db.commit()
    return _detail(_get_or_404(db, project.project_id))


@router.patch("/{project_id}", response_model=ProjectDetailOut)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    project = _get_or_404(db, project_id)
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Provide at least one field to update")

    # Changing current_stage here would desync it from stage_history; use /stages.
    if "current_stage" in changes and changes["current_stage"] != project.current_stage:
        raise HTTPException(
            status_code=400,
            detail=(
                "Use POST /projects/{project_id}/stages to move a project between "
                "stages, so the stage history stays consistent."
            ),
        )

    for field, value in changes.items():
        setattr(project, field, value)
    _audit(db, "update_project", "project", project_id, {"changed": list(changes)})
    db.commit()
    return _detail(_get_or_404(db, project_id))


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = _get_or_404(db, project_id)
    name = project.name
    db.delete(project)  # cascades to history, litigation, compensation, predictions
    _audit(db, "delete_project", "project", project_id, {"name": name})
    db.commit()


@router.post("/{project_id}/stages", response_model=List[StageHistoryOut], status_code=201)
def advance_stage(project_id: int, payload: StageAdvance, db: Session = Depends(get_db)):
    """Close the open stage and open the new one, keeping current_stage in step."""
    project = _get_or_404(db, project_id)
    if payload.stage == project.current_stage:
        raise HTTPException(status_code=400, detail=f"Project is already at stage {payload.stage}")

    now = payload.entered_at or datetime.now(timezone.utc)
    open_row = next((s for s in project.stage_history if s.exited_at is None), None)
    if open_row is not None:
        if now < open_row.entered_at:
            raise HTTPException(
                status_code=400, detail="entered_at is before the current stage started"
            )
        open_row.exited_at = now
        open_row.days_in_stage = (now - open_row.entered_at).days

    db.add(AcquisitionStageHistory(project_id=project_id, stage=payload.stage, entered_at=now))
    project.current_stage = payload.stage
    _audit(db, "advance_stage", "project", project_id, {"to": payload.stage})
    db.commit()

    refreshed = _get_or_404(db, project_id)
    return sorted(refreshed.stage_history, key=lambda s: s.entered_at)


@router.post("/{project_id}/litigation", response_model=LitigationOut, status_code=201)
def add_litigation(project_id: int, payload: LitigationCreate, db: Session = Depends(get_db)):
    _get_or_404(db, project_id)
    row = Litigation(
        project_id=project_id,
        status=payload.status,
        type=payload.type,
        filed_at=payload.filed_at or datetime.now(timezone.utc),
    )
    db.add(row)
    _audit(db, "add_litigation", "litigation", project_id, {"type": payload.type})
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{project_id}/litigation/{litigation_id}", response_model=LitigationOut)
def update_litigation(
    project_id: int, litigation_id: int, payload: LitigationUpdate, db: Session = Depends(get_db)
):
    row = (
        db.query(Litigation)
        .filter(Litigation.id == litigation_id, Litigation.project_id == project_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail=f"Litigation {litigation_id} not found")
    row.status = payload.status
    row.resolved_at = datetime.now(timezone.utc) if payload.status != "pending" else None
    _audit(db, "update_litigation", "litigation", litigation_id, {"status": payload.status})
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{project_id}/litigation/{litigation_id}", status_code=204)
def delete_litigation(project_id: int, litigation_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Litigation)
        .filter(Litigation.id == litigation_id, Litigation.project_id == project_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail=f"Litigation {litigation_id} not found")
    db.delete(row)
    _audit(db, "delete_litigation", "litigation", litigation_id, {})
    db.commit()


@router.post("/{project_id}/compensation", response_model=CompensationRecordOut, status_code=201)
def add_compensation(project_id: int, payload: CompensationCreate, db: Session = Depends(get_db)):
    """Append a new disbursement reading. The most recent row is what scoring uses."""
    _get_or_404(db, project_id)
    row = CompensationRecord(project_id=project_id, compensation_pct=payload.compensation_pct)
    db.add(row)
    _audit(db, "add_compensation", "compensation", project_id, {"pct": payload.compensation_pct})
    db.commit()
    db.refresh(row)
    return row
