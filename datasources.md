# LANDWATCH — Data Source Register

Phase 0 deliverable (engineeringplan.md §1). Tracks every candidate source, what it
actually provides, and — the column that decides the project — whether it carries
**outcome labels** we can train on.

Status as of 2026-08-27. Nothing here has been ingested yet; the running system uses
synthetic demo data only.

## 1. Register

| Source | Type | Access | Process features? | Delay outcome labels? | Status |
|---|---|---|---|---|---|
| **Bhoomi Rashi** (MoRTH e-portal for NH land acquisition) | Primary candidate | Government login; no public bulk export found | Yes — 3A/3C/3D/3G/3H notifications, dates, PAF counts | **Unconfirmed** — portal shows current status, historical stage transitions unclear | Access not yet obtained |
| **MoRTH annual reports / dashboards** | Aggregate | Public PDF/web | Partial — project-level milestones, no per-stage timing | No — aggregate only | Usable for sanity-checking magnitudes, not training |
| **NHAI project status pages** | Aggregate | Public web | Partial — award date, target date, physical progress | Weak proxy — target vs. actual completion exists for some projects | Worth scraping for a small real sample |
| **data.gov.in land acquisition datasets** | Open data | Public API/CSV | Varies by dataset; mostly state-level totals | No | Low value for per-project modelling |
| **CPGRAMS / court records** | Supplementary | Public but unstructured | Litigation counts, if matchable to projects | No | Hard to join to projects; deprioritised |
| **Synthetic generator** (`seed.py`) | Synthetic | In-repo | Yes — all engineered features | Yes, by construction | **In use.** Demo only, never presented as validation |

## 2. What this table is telling us

The features are obtainable. The **labels are not**, at least not yet from any source
confirmed accessible. That is the project's central risk (prd.md §8), and it is a data
problem, not an ML problem.

Two honest paths if no labelled source is secured:

1. **Proxy label from NHAI target-vs-actual dates** — a small real sample, weak label,
   but real. Would need the mentor to accept the proxy as a reasonable stand-in.
2. **Synthetic only, clearly disclosed** — demonstrates the pipeline end to end and
   claims nothing about real-world accuracy. Every record carries `is_synthetic`.

Either way the delay-label definition must be settled first (prd.md §9), because it
determines which sources are even candidates.

## 3. Questions this raises for the mentor

- Can the team get read access to Bhoomi Rashi historical stage transitions, or only
  current status?
- Is an NHAI target-vs-actual proxy label acceptable for an SIH prototype?
- What sample size would count as credible — 50 projects? 500?
- If only synthetic data is feasible, is that acceptable provided it is disclosed?
