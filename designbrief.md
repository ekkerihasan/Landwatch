# LANDWATCH — Design Brief

## 1. Design Principles

- **Explain before you alarm** — a risk badge is never shown without a one-click path to "why."
- **Officer-first, not model-first** — surface actionable information (stage, litigation, compensation) ahead of raw ML jargon.
- **Honest about uncertainty** — probabilities, not false precision; synthetic data is visibly labelled, never disguised as real.
- **Calm urgency** — Critical-risk items should draw the eye without feeling alarmist or gamified.

## 2. Visual Language

- **Risk colour coding:** Low = teal/green, Medium = amber, High = orange, Critical = red — consistent everywhere (badges, charts, stage tracker).
- **Typography:** one clean sans-serif (e.g. Inter) with a clear size scale — dashboard numbers and risk labels need to scan fast.
- **Layout:** data-dense but uncluttered — dashboard as a sortable table/list, not a chart wall; charts reserved for trend and SHAP views where they add real signal.

## 3. Key Screens

- **Risk Dashboard** — ranked project list, risk badge, trend arrow, quick filters (region, sector, stage).
- **Project Detail** — stage timeline (visual tracker for 3A→3C→3D→3G→3H/3E), current inputs, current risk.
- **SHAP Panel** — horizontal bar chart of top factors, plain-language one-liner per factor (e.g. "Low compensation offered is increasing risk").
- **What-If Panel** — sliders/inputs for actionable variables only, side-by-side before/after risk comparison, clearly labelled "scenario, not a guarantee."

## 4. Trust & Accessibility

- Every AI-generated view carries a persistent, unobtrusive label distinguishing prediction/explanation from ground truth.
- Colour is never the only signal — risk level also shown as text/icon for colour-blind accessibility.
- Officer actions (flag/dismiss) always require an explicit confirmation step — no silent automated action.