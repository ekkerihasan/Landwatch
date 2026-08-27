from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ShapExplanation(Base):
    """One contributing factor for one prediction.

    Named for SHAP because that is what will fill it once the model lands; while the
    interim rule is in use the rows hold its exact weighted contributions instead.
    """

    __tablename__ = "shap_explanations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(
        Integer, ForeignKey("prediction_results.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feature_name = Column(String(100), nullable=False)
    feature_value = Column(Float, nullable=True)
    contribution_value = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)  # plain-language one-liner for the UI

    prediction = relationship("PredictionResult", back_populates="explanations")
