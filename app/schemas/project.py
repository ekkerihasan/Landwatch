from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


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
    # Inputs the model had no data for — a neutral value was substituted, so the
    # score is less certain than the number alone suggests.
    missing_inputs: List[str] = []


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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
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


# --- Write payloads -----------------------------------------------------------

STAGES = ("3A", "3C", "3D", "3G", "3H", "3E")


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    sector: str = Field(default="National Highway", max_length=100)
    area: Optional[float] = Field(default=None, ge=0)
    paf_count: Optional[int] = Field(default=None, ge=0)
    current_stage: str = Field(default="3A", pattern="^(3A|3C|3D|3G|3H|3E)$")
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class ProjectUpdate(BaseModel):
    """Every field optional — only what is sent gets changed."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    location: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sector: Optional[str] = Field(default=None, max_length=100)
    area: Optional[float] = Field(default=None, ge=0)
    paf_count: Optional[int] = Field(default=None, ge=0)
    current_stage: Optional[str] = Field(default=None, pattern="^(3A|3C|3D|3G|3H|3E)$")
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class StageAdvance(BaseModel):
    """Close the open stage and open the next one."""

    stage: str = Field(pattern="^(3A|3C|3D|3G|3H|3E)$")
    entered_at: Optional[datetime] = None


class LitigationCreate(BaseModel):
    status: str = Field(default="pending", pattern="^(pending|resolved|withdrawn)$")
    type: Optional[str] = Field(default=None, max_length=100)
    filed_at: Optional[datetime] = None


class LitigationUpdate(BaseModel):
    status: str = Field(pattern="^(pending|resolved|withdrawn)$")


class CompensationCreate(BaseModel):
    compensation_pct: float = Field(ge=0, le=100)


class NewProjectScoreRequest(BaseModel):
    """Score a project that does not exist yet (map view).

    A project with no history has none of the model's strongest features, so the
    officer supplies estimates. The response is explicitly an estimate for a project
    WITH THESE CHARACTERISTICS, not a prediction about a real record.
    """

    location: str = Field(min_length=1, max_length=255)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    sector: str = Field(default="National Highway", max_length=100)
    area: float = Field(ge=0, default=50)
    paf_count: int = Field(ge=0, default=100)
    current_stage: str = Field(default="3A", pattern="^(3A|3C|3D|3G|3H|3E)$")
    days_in_current_stage: float = Field(ge=0, default=0)
    expected_litigations: float = Field(ge=0, default=0)
    planned_compensation_pct: float = Field(ge=0, le=100, default=0)


class NewProjectScoreResponse(BaseModel):
    prediction: Prediction
    inputs: dict
    is_estimate: bool = True
    disclaimer: str
