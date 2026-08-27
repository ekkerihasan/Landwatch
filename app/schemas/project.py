from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class RiskFactor(BaseModel):
    feature: str
    value: float
    contribution: float
    explanation: str


class Prediction(BaseModel):
    risk_class: str
    probability: float
    factors: List[RiskFactor]
    model_version: str
    is_mock_prediction: bool


class StageHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stage: str
    entered_at: datetime
    exited_at: Optional[datetime] = None
    days_in_stage: Optional[int] = None


class LitigationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    type: Optional[str] = None
    filed_at: datetime
    resolved_at: Optional[datetime] = None


class CompensationRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    compensation_pct: float
    updated_at: datetime


class CurrentFeatures(BaseModel):
    """The what-if baseline — the actionable inputs as they stand today."""

    days_in_current_stage: float
    open_litigations: float
    compensation_pct: float


class ProjectOut(BaseModel):
    """List-view shape — carries the current prediction so the dashboard can rank."""

    model_config = ConfigDict(from_attributes=True)

    project_id: int
    name: str
    location: str
    sector: str
    area: Optional[float] = None
    paf_count: Optional[int] = None
    current_stage: str
    created_at: datetime
    prediction: Prediction


class ProjectDetailOut(ProjectOut):
    current_features: CurrentFeatures
    stage_history: List[StageHistoryOut] = []
    litigations: List[LitigationOut] = []
    compensation_records: List[CompensationRecordOut] = []


class WhatIfRequest(BaseModel):
    """Only actionable features may be overridden; omitted ones keep today's value."""

    days_in_current_stage: Optional[float] = None
    open_litigations: Optional[float] = None
    compensation_pct: Optional[float] = None


class WhatIfResponse(BaseModel):
    scenario_id: int
    baseline: Prediction
    scenario: Prediction
    modified_features: dict
    probability_delta: float
    is_scenario: bool = True
    disclaimer: str


class FlagRequest(BaseModel):
    note: Optional[str] = None


class FlagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    note: Optional[str] = None
    status: str
    created_at: datetime
