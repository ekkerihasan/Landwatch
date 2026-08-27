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
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
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
LEAKY_COLUMNS = ["observed_elapsed_days"]


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

    model = fitted[best["model"]]
    version = f"{best['model']}-v1"
    trained_at = datetime.now(timezone.utc).isoformat()

    # Fit the SHAP explainer against the selected model. shap.Explainer dispatches to
    # LinearExplainer or TreeExplainer depending on what won, so this works either way.
    prep = model.named_steps["prep"]
    clf = model.named_steps["clf"]
    background = prep.transform(X_train.sample(min(400, len(X_train)), random_state=42))
    feature_names_out = list(prep.get_feature_names_out())
    explainer = shap.Explainer(clf, background, feature_names=feature_names_out)
    print(f"SHAP explainer: {type(explainer).__name__} over {len(feature_names_out)} encoded features")

    joblib.dump(
        {
            "pipeline": model,
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
