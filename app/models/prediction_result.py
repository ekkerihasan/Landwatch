from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PredictionResult(Base):
    """Every prediction is kept for audit and trend display."""

    __tablename__ = "prediction_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True
    )
    snapshot_id = Column(
        Integer, ForeignKey("project_feature_snapshots.id", ondelete="SET NULL"), nullable=True
    )
    model_version = Column(String(100), nullable=False)
    risk_class = Column(String(20), nullable=False, index=True)
    probability = Column(Float, nullable=False)
    is_mock_prediction = Column(Boolean, nullable=False, default=True)
    predicted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    project = relationship("Project", back_populates="predictions")
    explanations = relationship(
        "ShapExplanation", back_populates="prediction", cascade="all, delete-orphan"
    )
