from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProjectFeatureSnapshot(Base):
    """Point-in-time feature vector a prediction was made from."""

    __tablename__ = "project_feature_snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True
    )
    data_source_id = Column(Integer, ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    snapshot_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    feature_json = Column(JSON, nullable=False)
    is_synthetic = Column(Boolean, nullable=False, default=True, index=True)

    project = relationship("Project", back_populates="feature_snapshots")
