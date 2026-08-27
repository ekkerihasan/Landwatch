"""Load demo projects into the database.

The data is SYNTHETIC — invented for the prototype demo, not real acquisition
records (prd.md §8). Stage/litigation/compensation values are chosen to produce a
realistic spread of risk levels across the dashboard.

Usage:  .venv\Scripts\python.exe seed.py
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import text

from app.database import SessionLocal
from app.models import AcquisitionStageHistory, CompensationRecord, Litigation, Project

NOW = datetime.now(timezone.utc)


def days_ago(n: int) -> datetime:
    return NOW - timedelta(days=n)


# (project fields, days in current stage, [(litigation status, type, filed days ago)], compensation %)
DEMO_PROJECTS = [
    (
        dict(
            project_id=1,
            name="NH-44 Nagpur Bypass — Package III",
            location="Nagpur, Maharashtra",
            sector="National Highway",
            area=142.5,
            paf_count=312,
            current_stage="3D",
            latitude=21.1458,
            longitude=79.0882,
            rehabilitation_progress_pct=48.0,
            created_at=datetime(2024, 2, 15, 8, 30, tzinfo=timezone.utc),
        ),
        200,
        [("pending", "Title dispute", 150), ("pending", "Compensation dispute", 90), ("resolved", "Title dispute", 400)],
        62.0,
    ),
    (
        dict(
            project_id=2,
            name="NH-19 Varanasi Ring Road — Phase 2",
            location="Varanasi, Uttar Pradesh",
            sector="National Highway",
            area=89.3,
            paf_count=187,
            current_stage="3A",
            latitude=25.3176,
            longitude=82.9739,
            rehabilitation_progress_pct=91.0,
            created_at=datetime(2024, 6, 10, 10, 0, tzinfo=timezone.utc),
        ),
        25,
        [],
        88.0,
    ),
    (
        dict(
            project_id=3,
            name="NH-48 Rajmarg Extension — Surat Corridor",
            location="Surat, Gujarat",
            sector="National Highway",
            area=210.0,
            paf_count=445,
            current_stage="3G",
            latitude=21.1702,
            longitude=72.8311,
            rehabilitation_progress_pct=34.0,
            created_at=datetime(2023, 11, 3, 9, 15, tzinfo=timezone.utc),
        ),
        310,
        [
            ("pending", "Compensation dispute", 280),
            ("pending", "Title dispute", 240),
            ("pending", "Valuation challenge", 120),
            ("pending", "Rehabilitation claim", 60),
        ],
        41.0,
    ),
    (
        dict(
            project_id=4,
            name="NH-16 Vijayawada Eastern Bypass",
            location="Vijayawada, Andhra Pradesh",
            sector="National Highway",
            area=67.8,
            paf_count=98,
            current_stage="3C",
            latitude=16.5062,
            longitude=80.6480,
            rehabilitation_progress_pct=72.0,
            created_at=datetime(2024, 8, 22, 7, 45, tzinfo=timezone.utc),
        ),
        70,
        [("pending", "Valuation challenge", 40)],
        74.0,
    ),
    (
        dict(
            project_id=5,
            name="NH-27 Gorakhpur–Ayodhya Link — Section B",
            location="Ayodhya, Uttar Pradesh",
            sector="National Highway",
            area=155.2,
            paf_count=276,
            current_stage="3H",
            latitude=26.7922,
            longitude=82.1998,
            rehabilitation_progress_pct=61.0,
            created_at=datetime(2023, 12, 18, 11, 20, tzinfo=timezone.utc),
        ),
        95,
        [("pending", "Rehabilitation claim", 70), ("resolved", "Title dispute", 300)],
        68.0,
    ),
]

# Stages a project passed through before reaching its current one.
STAGE_SEQUENCE = ["3A", "3C", "3D", "3G", "3H", "3E"]


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(Project).count()
        if existing:
            print(f"{existing} project(s) already present — clearing before reseed.")
            db.query(Project).delete()
            db.commit()

        for fields, stage_days, litigations, compensation in DEMO_PROJECTS:
            project = Project(**fields)
            db.add(project)
            db.flush()  # assign PK before adding children

            # Closed history for every stage before the current one.
            entered = fields["created_at"]
            for stage in STAGE_SEQUENCE[: STAGE_SEQUENCE.index(fields["current_stage"])]:
                exited = entered + timedelta(days=45)
                db.add(
                    AcquisitionStageHistory(
                        project_id=project.project_id,
                        stage=stage,
                        entered_at=entered,
                        exited_at=exited,
                        days_in_stage=45,
                    )
                )
                entered = exited

            # The current stage stays open — this is what the risk rule reads.
            db.add(
                AcquisitionStageHistory(
                    project_id=project.project_id,
                    stage=fields["current_stage"],
                    entered_at=days_ago(stage_days),
                    exited_at=None,
                    days_in_stage=None,
                )
            )

            for status, lit_type, filed in litigations:
                db.add(
                    Litigation(
                        project_id=project.project_id,
                        status=status,
                        type=lit_type,
                        filed_at=days_ago(filed),
                        resolved_at=None if status == "pending" else days_ago(filed - 30),
                    )
                )

            db.add(
                CompensationRecord(
                    project_id=project.project_id,
                    compensation_pct=compensation,
                    updated_at=days_ago(15),
                )
            )

        db.commit()

        # The rows above set project_id explicitly, and Postgres does not advance a
        # SERIAL sequence for supplied ids. Without this reset the next real INSERT
        # collides with an existing key and every "create project" fails.
        db.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('projects', 'project_id'), "
                "COALESCE((SELECT MAX(project_id) FROM projects), 1))"
            )
        )
        db.commit()

        print(f"Seeded {len(DEMO_PROJECTS)} synthetic projects.")

        # Show what the interim risk rule makes of them.
        from app.risk import score_project_auto as score_project

        for project in db.query(Project).all():
            result = score_project(project)
            print(f"  #{project.project_id} {project.name[:42]:42} {result['risk_class']:8} p={result['probability']}")
    finally:
        db.close()



# --- Data source register (see datasources.md) -------------------------------
DEMO_SOURCES = [
    ("Bhoomi Rashi (MoRTH)", "bhoomi_rashi", "Primary candidate. Access not yet obtained; label availability unconfirmed."),
    ("MoRTH annual reports", "morth", "Aggregate only — useful for sanity-checking magnitudes, not training."),
    ("NHAI project status pages", "nhai", "Possible weak target-vs-actual proxy label for a small real sample."),
    ("Synthetic generator (seed.py)", "synthetic", "In use for the prototype demo. Never presented as real-world validation."),
]


def seed_sources() -> None:
    from app.models import DataSource

    db = SessionLocal()
    try:
        if db.query(DataSource).count():
            db.query(DataSource).delete()
            db.commit()
        for name, type_, notes in DEMO_SOURCES:
            db.add(DataSource(name=name, type=type_, coverage_notes=notes))
        db.commit()
        print(f"Seeded {len(DEMO_SOURCES)} data sources.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
    seed_sources()
