"""The delay-label definition — the single most important choice in this project.

PROVISIONAL. prd.md §9 lists this as an open question for the mentor: statutory
baseline vs. historical baseline vs. severity bands. We use the statutory baseline
because it is the only one computable without historical outcome data we do not have.

    expected_total_days = sum of STAGE_EXPECTED_DAYS for every stage up to and
                          including the project's current stage
    delay_label = 1  if  actual_elapsed_days > DELAY_THRESHOLD * expected_total_days

Changing DELAY_THRESHOLD changes the target and therefore the whole model. It is
defined here, once, so the mentor conversation has exactly one thing to point at.
"""

# Single source: app/stages.py
from app.stages import STAGE_EXPECTED_DAYS, STAGE_SEQUENCE, expected_total_days  # noqa: F401

# A project is "significantly delayed" once it exceeds the statutory baseline by 50%.
DELAY_THRESHOLD = 1.5


def is_delayed(actual_elapsed_days: float, current_stage: str) -> int:
    return int(actual_elapsed_days > DELAY_THRESHOLD * expected_total_days(current_stage))
