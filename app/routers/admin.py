import json
import os

from fastapi import APIRouter

from app import model as trained_model

router = APIRouter(prefix="/admin", tags=["admin"])

METRICS_PATH = os.getenv("MODEL_METRICS", "ml/artifacts/metrics.json")


@router.get("/model")
def model_info():
    """Current model version, training date and evaluation metrics (technicaldesign.md §3)."""
    from app.stages import BASELINE_SOURCE, STAGE_EXPECTED_DAYS

    artifact = trained_model.load_artifact()
    if artifact is None:
        return {
            "status": "no_model",
            "model_version": "rule-based-placeholder-v0",
            "trained_on": None,
            "note": "No trained artifact found — the API is serving the interim rule. Run `python -m ml.train`.",
        }

    metrics = None
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, encoding="utf-8") as f:
            metrics = json.load(f)

    return {
        "status": "loaded",
        "model_version": artifact["model_version"],
        "model_name": artifact["model_name"],
        "trained_at": artifact["trained_at"],
        "trained_on": artifact["trained_on"],
        "n_train": artifact["n_train"],
        "features": artifact["features"],
        "stage_baselines": STAGE_EXPECTED_DAYS,
        "baseline_source": BASELINE_SOURCE,
        "metrics": metrics,
        "disclaimer": (
            "Trained on SYNTHETIC data. These metrics show the pipeline works; they are "
            "not evidence of real-world accuracy (prd.md §8)."
        ),
    }
