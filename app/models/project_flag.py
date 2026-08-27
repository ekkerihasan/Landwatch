from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProjectFlag(Base):
    """Officer flags a project for investigation, with the model's rationale attached
    (PRD §6 — Recommendation / Flag for Review)."""

    __tablename__ = "project_flags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True
    )
    prediction_id = Column(
        Integer, ForeignKey("prediction_results.id", ondelete="SET NULL"), nullable=True
    )
    flagged_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    note = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="open", index=True)  # open / resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="flags")
