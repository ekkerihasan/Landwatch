from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, index=True)  # bhoomi_rashi / morth / nhai / synthetic / other
    last_validated_at = Column(DateTime(timezone=True), nullable=True)
    coverage_notes = Column(Text, nullable=True)
