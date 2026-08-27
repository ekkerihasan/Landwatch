"""Train and compare delay-risk models, then persist the winner.

The task is EARLY detection: features are observed before the project crosses the
delay threshold, and the target is its eventual outcome. See ml/generate_dataset.py.

Order per engineeringplan.md §1: Logistic Regression baseline FIRST, then Random
Forest and XGBoost measured against it. Selection is by recall and AUC on the
delayed class — never accuracy, which a 35% base rate makes meaningless.

The split is time-based (oldest projects train, newest test) to avoid the leakage a
random split would hide, per technicaldesign.md §4.1.

IMPORTANT: this trains on SYNTHETIC data. The metrics below measure whether the
pipeline works, not whether the system predicts real delays.
"""
import json
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from scipy.stats import spearmanr
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    mean_absolute_error,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

DATA = "ml/data/synthetic_projects.csv"
ARTIFACT = "ml/artifacts/model.joblib"
METRICS = "ml/artifacts/metrics.json"

NUMERIC_FEATURES = [
    "paf_count",
    "area",
    "open_litigations",
    "resolved_litigations",
    "compensation_pct",
    "rehabilitation_progress_pct",
    # days_in_current_stage is deliberately absent: it is stage_overrun_ratio times a
    # per-stage constant, and keeping both let the linear model split one signal into
    # two opposing coefficients — SHAP then reported schedule overrun as REDUCING risk.
    "prior_stage_avg_days",
    "stage_overrun_ratio",
    "stage_index",
]
CATEGORICAL_FEATURES = ["current_stage"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET = "delay_label"

# observed_elapsed_days is EXCLUDED: it is partly an artifact of how the observation
# window is censored in the generator, and days_in_current_stage plus
# stage_overrun_ratio already carry the realistic timing signal.
# observed_elapsed_days and remaining_delay_days are both excluded: the first is an
# artifact of how the observation window is censored, the second is the target seen
# from the other side.
LEAKY_COLUMNS = ["observed_elapsed_days", "remaining_delay_days"]

# Regression target (V2 contract Gap 1). Quantiles give the card a range instead of
# a point estimate, which is the only defensible thing to show from synthetic data.
REGRESSION_TARGET = "delay_days"
QUANTILES = {"lower": 0.10, "median": 0.50, "upper": 0.90}


def time_split(df: pd.DataFrame, test_fraction: float = 0.25):
    """Oldest projects train, newest test — no random shuffling."""
    df = df.sort_values("started_day", ascending=False).reset_index(drop=True)
    cut = int(len(df) * (1 - test_fraction))
    return df.iloc[:cut], df.iloc[cut:]


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        [
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ]
    )


def evaluate(name: str, model, X_test, y_test) -> dict:
    proba = model.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
    return {
        "model": name,
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "pr_auc": round(average_precision_score(y_test, proba), 4),
        "recall_delayed": round(recall_score(y_test, pred), 4),
        "precision_delayed": round(precision_score(y_test, pred, zero_division=0), 4),
        "f1_delayed": round(f1_score(y_test, pred), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def main() -> None:
    df = pd.read_csv(DATA)
    train_df, test_df = time_split(df)
    X_train, y_train = train_df[FEATURES], train_df[TARGET]
    X_test, y_test = test_df[FEATURES], test_df[TARGET]

    print(f"train {len(train_df)} rows ({y_train.mean():.1%} delayed) | "
          f"test {len(test_df)} rows ({y_test.mean():.1%} delayed)")
    print(f"excluded as leaky: {LEAKY_COLUMNS}\n")

    candidates = {
        "logistic_regression": Pipeline([
            ("prep", build_preprocessor()),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
        ]),
        "random_forest": Pipeline([
            ("prep", build_preprocessor()),
            ("clf", RandomForestClassifier(
                n_estimators=300, min_samples_leaf=4, class_weight="balanced",
                random_state=42, n_jobs=-1)),
        ]),
        "xgboost": Pipeline([
            ("prep", build_preprocessor()),
            ("clf", XGBClassifier(
                n_estimators=350, max_depth=4, learning_rate=0.06,
                subsample=0.9, colsample_bytree=0.9, reg_lambda=1.5,
                eval_metric="logloss", random_state=42, n_jobs=-1)),
        ]),
    }

    results = []
    fitted = {}
    for name, pipe in candidates.items():
        pipe.fit(X_train, y_train)
        fitted[name] = pipe
        result = evaluate(name, pipe, X_test, y_test)
        results.append(result)
        print(f"  {name:20} AUC={result['roc_auc']:.3f}  PR-AUC={result['pr_auc']:.3f}  "
              f"recall={result['recall_delayed']:.3f}  precision={result['precision_delayed']:.3f}")

    baseline = results[0]
    # Select on recall for the delayed class, breaking ties on AUC — missing a
    # delayed project costs more than a false alarm an officer can dismiss.
    best = max(results, key=lambda r: (r["recall_delayed"], r["roc_auc"]))
    print(f"\nbaseline : {baseline['model']} (AUC {baseline['roc_auc']:.3f}, recall {baseline['recall_delayed']:.3f})")
    print(f"selected : {best['model']} (AUC {best['roc_auc']:.3f}, recall {best['recall_delayed']:.3f})")
    if best["model"] != baseline["model"]:
        lift = best["roc_auc"] - baseline["roc_auc"]
        print(f"           AUC lift over baseline: {lift:+.3f}")
    else:
        print("           no candidate beat the baseline — keeping it")

    # --- Calibration ------------------------------------------------------
    # An uncalibrated score is not a probability, and the card puts a "%" after it.
    # Sigmoid calibration on a held-out split, with Brier before/after so the claim
    # is measurable rather than asserted.
    raw_model = fitted[best["model"]]
    raw_brier = brier_score_loss(y_test, raw_model.predict_proba(X_test)[:, 1])
    calibrated = CalibratedClassifierCV(raw_model, method="sigmoid", cv=5)
    calibrated.fit(X_train, y_train)
    cal_proba = calibrated.predict_proba(X_test)[:, 1]
    cal_brier = brier_score_loss(y_test, cal_proba)
    cal_auc = roc_auc_score(y_test, cal_proba)
    print(f"calibration      Brier {raw_brier:.4f} -> {cal_brier:.4f}  "
          f"(lower is better)  AUC {best['roc_auc']:.3f} -> {cal_auc:.3f}")

    use_calibrated = cal_brier <= raw_brier
    print("  using the calibrated model" if use_calibrated
          else "  calibration made it worse — keeping the raw model")

    model = calibrated if use_calibrated else raw_model
    calibration_metrics = {
        "method": "sigmoid" if use_calibrated else "none",
        "brier_raw": round(raw_brier, 4),
        "brier_calibrated": round(cal_brier, 4),
        "auc_calibrated": round(cal_auc, 4),
    }

    version = f"{best['model']}-v1"
    trained_at = datetime.now(timezone.utc).isoformat()

    # Fit the SHAP explainer against the selected model. shap.Explainer dispatches to
    # LinearExplainer or TreeExplainer depending on what won, so this works either way.
    # SHAP explains the underlying pipeline; the calibrator only rescales its output.
    prep = raw_model.named_steps["prep"]
    clf = raw_model.named_steps["clf"]
    background = prep.transform(X_train.sample(min(400, len(X_train)), random_state=42))
    feature_names_out = list(prep.get_feature_names_out())
    explainer = shap.Explainer(clf, background, feature_names=feature_names_out)
    print(f"SHAP explainer: {type(explainer).__name__} over {len(feature_names_out)} encoded features")

    # --- Delay-days regressor (V2 contract Gap 1) --------------------------
    # Three quantile models give a range rather than a false-precision point
    # estimate. Censoring: this synthetic set has no censored projects — every one
    # has an eventual duration — so nothing is dropped. A real dataset will have
    # projects still running at MAX_DAYS, and those cannot be trained on this way.
    print()
    reg_train = train_df[train_df[REGRESSION_TARGET].notna()]
    reg_test = test_df[test_df[REGRESSION_TARGET].notna()]
    regressors = {}
    for name, q in QUANTILES.items():
        pipe = Pipeline([
            ("prep", build_preprocessor()),
            ("reg", GradientBoostingRegressor(
                loss="quantile", alpha=q, n_estimators=250, max_depth=3,
                learning_rate=0.07, random_state=42)),
        ])
        pipe.fit(reg_train[FEATURES], reg_train[REGRESSION_TARGET])
        regressors[name] = pipe

    pred_lo = regressors["lower"].predict(reg_test[FEATURES]).clip(0)
    pred_md = regressors["median"].predict(reg_test[FEATURES]).clip(0)
    pred_hi = regressors["upper"].predict(reg_test[FEATURES]).clip(0)
    actual = reg_test[REGRESSION_TARGET].values

    mae = mean_absolute_error(actual, pred_md)
    coverage = float(((actual >= pred_lo) & (actual <= pred_hi)).mean())
    # The class and the days must move together, or the card contradicts itself.
    #
    # Measured WITHIN each stage, deliberately. The classifier's target is RELATIVE to
    # the stage baseline (1.5x the statutory total); the regressor's target is ABSOLUTE
    # days. Across stages those orderings must diverge — a 3A project at 30% risk means
    # roughly 9 days, a 3E project at the same 30% means roughly 109 — so a pooled
    # correlation measures the wrong thing. A card shows one project at one stage, so
    # within-stage agreement is what its credibility rests on.
    class_proba = model.predict_proba(reg_test[FEATURES])[:, 1]
    pooled = float(spearmanr(class_proba, pred_md).statistic)

    per_stage = {}
    for stage in reg_test["current_stage"].unique():
        mask = (reg_test["current_stage"] == stage).values
        if mask.sum() < 25:
            continue
        per_stage[stage] = float(spearmanr(class_proba[mask], pred_md[mask]).statistic)
    weights = {s: int((reg_test["current_stage"] == s).sum()) for s in per_stage}
    total_w = sum(weights.values()) or 1
    consistency = sum(per_stage[s] * weights[s] for s in per_stage) / total_w

    print(f"delay regressor  MAE={mae:.0f} days  "
          f"interval coverage={coverage:.1%} (target ~80%)")
    print(f"  class/days agreement  within-stage {consistency:.3f}  (pooled {pooled:.3f})")
    print("  per stage: " + "  ".join(f"{s}={v:.2f}" for s, v in sorted(per_stage.items())))
    if consistency < 0.7:
        print("  WARNING: classifier and regressor disagree — do not show both on one card")

    regression_metrics = {
        "target": REGRESSION_TARGET,
        "mae_days": round(mae, 1),
        "interval": [QUANTILES["lower"], QUANTILES["upper"]],
        "interval_coverage": round(coverage, 4),
        "class_days_agreement": round(consistency, 4),
        "class_days_agreement_pooled": round(pooled, 4),
        "class_days_agreement_by_stage": {s: round(v, 4) for s, v in per_stage.items()},
        "agreement_note": (
            "Measured within stage. The classifier target is relative to the stage "
            "baseline, the regressor target is absolute days, so a pooled correlation "
            "understates agreement. A card shows one project at one stage."
        ),
        "n_train": len(reg_train),
        "censoring": "none — synthetic projects all have an eventual duration",
    }

    joblib.dump(
        {
            "pipeline": model,
            "regressors": regressors,
            "regression_metrics": regression_metrics,
            "calibration": calibration_metrics,
            "shap_pipeline": raw_model,
            "explainer": explainer,
            "feature_names_out": feature_names_out,
            "model_name": best["model"],
            "model_version": version,
            "features": FEATURES,
            "numeric_features": NUMERIC_FEATURES,
            "categorical_features": CATEGORICAL_FEATURES,
            "trained_at": trained_at,
            "trained_on": "synthetic",
            "n_train": len(train_df),
            "metrics": best,
        },
        ARTIFACT,
    )
    with open(METRICS, "w", encoding="utf-8") as f:
        json.dump(
            {
                "selected": best,
                "baseline": baseline,
                "all_results": results,
                "regression": regression_metrics,
                "calibration": calibration_metrics,
                "trained_at": trained_at,
                "trained_on": "synthetic",
                "delay_label": "statutory baseline, 1.5x threshold (PROVISIONAL)",
                "note": "Synthetic data — measures pipeline correctness, not real-world accuracy.",
            },
            f,
            indent=2,
        )
    print(f"\nsaved {ARTIFACT} ({version})")
    print(f"saved {METRICS}")


if __name__ == "__main__":
    main()
