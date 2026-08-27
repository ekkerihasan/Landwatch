from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class WhatIfScenario(Base):
    """A hypothetical re-score. Kept separate from PredictionResult so a scenario is
    never mistaken for a real prediction (technicaldesign.md §5)."""

    __tablename__ = "what_if_scenarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True
    )
    base_prediction_id = Column(
        Integer, ForeignKey("prediction_results.id", ondelete="SET NULL"), nullable=True
    )
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    modified_features_json = Column(JSON, nullable=False)
    resulting_risk_class = Column(String(20), nullable=False)
    resulting_probability = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="what_if_scenarios")
