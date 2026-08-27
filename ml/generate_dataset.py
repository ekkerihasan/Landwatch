"""Generate a synthetic training set for EARLY delay detection.

SYNTHETIC — for demonstrating the pipeline only. Metrics measured on this data say
nothing about real-world accuracy (prd.md §8).

Two deliberate design choices, both of which matter more than the model itself:

1. The latent process is NOT the weighted rule in app/risk.py. If it were, the model
   would memorise that rule and the exercise would be circular.

2. Features are observed at a point BEFORE the project has crossed the delay
   threshold, and the label is its EVENTUAL outcome. This is what "early detection"
   means (prd.md §2). Labelling a project delayed from the elapsed time that defines
   the label is trivially circular and produces a meaningless AUC near 1.0.
"""
import numpy as np
import pandas as pd

from ml.delay_label import (
    DELAY_THRESHOLD,
    STAGE_EXPECTED_DAYS,
    STAGE_SEQUENCE,
    expected_total_days,
)

SEED = 42
N_PROJECTS = 3000

# Synthetic base rate for the delayed class. Real Indian NH acquisition delay rates are
# not known to us — this is a plausible-looking knob for demo balance, NOT a finding.
TARGET_DELAY_RATE = 0.35

STATES = [
    "Maharashtra", "Uttar Pradesh", "Gujarat", "Andhra Pradesh",
    "Karnataka", "Rajasthan", "Madhya Pradesh", "Tamil Nadu",
]


def generate(n: int = N_PROJECTS, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # --- Project attributes -------------------------------------------------
    stage_idx = rng.choice(len(STAGE_SEQUENCE), size=n, p=[0.18, 0.20, 0.22, 0.18, 0.13, 0.09])
    current_stage = np.array(STAGE_SEQUENCE)[stage_idx]
    state = rng.choice(STATES, size=n)

    paf_count = np.clip(rng.lognormal(mean=4.9, sigma=0.85, size=n), 5, 3000).round()
    area = np.clip(paf_count * rng.normal(0.45, 0.18, size=n) + rng.normal(0, 12, size=n), 3, 900).round(1)

    # --- Latent causes (never observed by the model) ------------------------
    friction = rng.normal(0, 1, size=n)  # district administrative capacity

    lit_propensity = np.exp(-0.55 + 0.55 * np.log1p(paf_count) / 3 + 0.35 * friction)
    eventual_open_lit = rng.poisson(np.clip(lit_propensity, 0, 6), size=n)
    eventual_resolved_lit = rng.poisson(np.clip(lit_propensity * 0.7, 0, 5), size=n)
    eventual_comp = np.clip(
        92 - 7.5 * eventual_open_lit - 6.0 * friction + rng.normal(0, 9, size=n), 0, 100
    )

    # Rehabilitation & resettlement runs alongside acquisition. It lags where
    # displacement is large and administrative capacity is thin, and a lagging R&R
    # process holds up possession independently of compensation.
    eventual_rehab = np.clip(
        88 - 0.9 * np.log1p(paf_count) * 4.0 - 7.0 * friction + rng.normal(0, 11, size=n), 0, 100
    )

    # --- Eventual delay pressure: interactions + noise ----------------------
    lit_pressure = np.log1p(eventual_open_lit) * 0.85
    comp_gap = (100 - eventual_comp) / 100
    rehab_gap = (100 - eventual_rehab) / 100
    interaction = 1.15 * lit_pressure * comp_gap  # the two compound
    scale_effect = 0.42 * (np.log1p(paf_count) / np.log(3000))

    pressure = (
        0.75 * lit_pressure
        + 0.80 * comp_gap
        + 0.50 * rehab_gap
        + interaction
        + scale_effect
        + 0.55 * friction
        + rng.normal(0, 0.45, size=n)  # irreducible noise — keeps AUC realistic
    )

    expected_total = np.array([expected_total_days(s) for s in current_stage])
    # multiplier > DELAY_THRESHOLD  <=>  pressure - offset > log(exp(0.6) - 1) = -0.196
    offset = np.quantile(pressure, 1 - TARGET_DELAY_RATE) + 0.196
    eventual_multiplier = 0.9 + np.log1p(np.exp(pressure - offset))
    eventual_total = np.clip(expected_total * eventual_multiplier, 10, None)

    # The label is the EVENTUAL outcome.
    delay_label = (eventual_total > DELAY_THRESHOLD * expected_total).astype(int)

    # --- Observation point: strictly before the threshold is crossed --------
    # We look at each project partway through, while it still looks salvageable.
    # This is the "early warning" window the PRD is about.
    censor_limit = np.minimum(eventual_total, DELAY_THRESHOLD * expected_total)
    obs_fraction = rng.uniform(0.25, 0.92, size=n)
    observed_elapsed = np.clip(obs_fraction * censor_limit, 5, None)

    # Litigation accrues over time — we only see what has been filed so far.
    open_litigations = rng.binomial(eventual_open_lit, np.clip(obs_fraction, 0, 1))
    resolved_litigations = rng.binomial(eventual_resolved_lit, np.clip(obs_fraction * 0.8, 0, 1))

    # Compensation climbs as the project progresses, toward its eventual level.
    compensation_pct = np.clip(
        eventual_comp * (0.35 + 0.65 * obs_fraction) + rng.normal(0, 5, size=n), 0, 100
    ).round(1)

    # R&R progress climbs with the project, like compensation.
    rehabilitation_progress_pct = np.clip(
        eventual_rehab * (0.30 + 0.70 * obs_fraction) + rng.normal(0, 6, size=n), 0, 100
    ).round(1)

    # --- Observable timing features -----------------------------------------
    current_expected = np.array([STAGE_EXPECTED_DAYS[s] for s in current_stage])
    share = np.clip(rng.beta(2.2, 3.0, size=n), 0.05, 0.95)
    days_in_current_stage = np.clip(observed_elapsed * share, 1, None).round()
    prior_elapsed = np.clip(observed_elapsed - days_in_current_stage, 0, None)
    prior_stages = np.maximum(stage_idx, 1)
    prior_stage_avg_days = (prior_elapsed / prior_stages).round(1)

    df = pd.DataFrame({
        "current_stage": current_stage,
        "stage_index": stage_idx,
        "state": state,
        "paf_count": paf_count.astype(int),
        "area": area,
        "open_litigations": open_litigations,
        "resolved_litigations": resolved_litigations,
        "compensation_pct": compensation_pct,
        "rehabilitation_progress_pct": rehabilitation_progress_pct,
        "days_in_current_stage": days_in_current_stage.astype(int),
        "prior_stage_avg_days": prior_stage_avg_days,
        "stage_overrun_ratio": (days_in_current_stage / current_expected).round(3),
        "observed_elapsed_days": observed_elapsed.round().astype(int),
        "delay_label": delay_label,
        # Regression target (V2 contract Gap 1): days of overrun beyond the statutory
        # baseline, still to come as of the observation point. Zero when the project
        # finishes within baseline — the regressor learns "no overrun" as a real value.
        "delay_days": np.clip(eventual_total - expected_total, 0, None).round().astype(int),
        "remaining_delay_days": np.clip(eventual_total - observed_elapsed, 0, None).round().astype(int),
    })

    # A start date lets us do a time-based split instead of a random one.
    df["started_day"] = rng.integers(0, 1460, size=n)
    return df.sort_values("started_day", ascending=False).reset_index(drop=True)


if __name__ == "__main__":
    data = generate()
    out = "ml/data/synthetic_projects.csv"
    data.to_csv(out, index=False)
    print(f"Wrote {len(data)} synthetic projects to {out}")
    print(f"  delay rate       : {data['delay_label'].mean():.1%}  ({data['delay_label'].sum()} eventually delayed)")
    print(f"  observed BEFORE crossing the threshold — this is an early-warning task")
    print(f"  median open lit  : {data['open_litigations'].median():.0f}")
    print(f"  median comp %    : {data['compensation_pct'].median():.0f}")
    print(f"  delay rate by open litigation:")
    grp = data.groupby(data["open_litigations"].clip(upper=3))["delay_label"].mean()
    for k, v in grp.items():
        print(f"    {k}{'+' if k == 3 else ' '} open : {v:.1%}")
