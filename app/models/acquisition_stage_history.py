from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AcquisitionStageHistory(Base):
    __tablename__ = "acquisition_stage_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True
    )
    stage = Column(String(10), nullable=False)  # 3A/3C/3D/3G/3H/3E
    entered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    exited_at = Column(DateTime(timezone=True), nullable=True)
    days_in_stage = Column(Integer, nullable=True)

    project = relationship("Project", back_populates="stage_history")
