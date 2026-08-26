from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Litigation(Base):
    __tablename__ = "litigations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True
    )
    status = Column(String(50), nullable=False, index=True)  # pending / resolved / withdrawn
    type = Column(String(100), nullable=True)  # e.g., title dispute, compensation dispute
    filed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="litigations")
