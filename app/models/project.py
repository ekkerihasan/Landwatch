from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=False, index=True)
    area = Column(Float, nullable=True)  # hectares or sq.m
    paf_count = Column(Integer, nullable=True)  # Project Affected Families
    current_stage = Column(String(10), nullable=False, index=True)  # 3A/3C/3D/3G/3H/3E
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    stage_history = relationship(
        "AcquisitionStageHistory", back_populates="project", cascade="all, delete-orphan"
    )
    litigations = relationship(
        "Litigation", back_populates="project", cascade="all, delete-orphan"
    )
    compensation_records = relationship(
        "CompensationRecord", back_populates="project", cascade="all, delete-orphan"
    )
