from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DelayOutcome(Base):
    """Officer-recorded ground truth — the feedback loop that feeds retraining."""

    __tablename__ = "delay_outcomes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True
    )
    actual_outcome = Column(Text, nullable=True)
    delay_label = Column(String(50), nullable=True, index=True)  # target once the definition is agreed
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    recorded_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)

    project = relationship("Project", back_populates="delay_outcomes")
