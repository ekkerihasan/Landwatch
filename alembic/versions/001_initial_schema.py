"""initial schema — Project, AcquisitionStageHistory, Litigation, CompensationRecord, User

Revision ID: 001_initial
Revises:
Create Date: 2026-08-26 10:20:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Projects
    op.create_table(
        "projects",
        sa.Column("project_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("sector", sa.String(length=100), nullable=False),
        sa.Column("area", sa.Float(), nullable=True),
        sa.Column("paf_count", sa.Integer(), nullable=True),
        sa.Column("current_stage", sa.String(length=10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("project_id"),
    )
    op.create_index(op.f("ix_projects_name"), "projects", ["name"], unique=False)
    op.create_index(op.f("ix_projects_sector"), "projects", ["sector"], unique=False)
    op.create_index(op.f("ix_projects_current_stage"), "projects", ["current_stage"], unique=False)

    # Users
    op.create_table(
        "users",
        sa.Column("user_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("region_scope", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)

    # Acquisition stage history
    op.create_table(
        "acquisition_stage_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("stage", sa.String(length=10), nullable=False),
        sa.Column("entered_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("exited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("days_in_stage", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_acquisition_stage_history_project_id"),
        "acquisition_stage_history",
        ["project_id"],
        unique=False,
    )

    # Litigations
    op.create_table(
        "litigations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("type", sa.String(length=100), nullable=True),
        sa.Column("filed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_litigations_project_id"), "litigations", ["project_id"], unique=False)
    op.create_index(op.f("ix_litigations_status"), "litigations", ["status"], unique=False)

    # Compensation records
    op.create_table(
        "compensation_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("compensation_pct", sa.Float(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_compensation_records_project_id"), "compensation_records", ["project_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_compensation_records_project_id"), table_name="compensation_records")
    op.drop_table("compensation_records")
    op.drop_index(op.f("ix_litigations_status"), table_name="litigations")
    op.drop_index(op.f("ix_litigations_project_id"), table_name="litigations")
    op.drop_table("litigations")
    op.drop_index(
        op.f("ix_acquisition_stage_history_project_id"), table_name="acquisition_stage_history"
    )
    op.drop_table("acquisition_stage_history")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_projects_current_stage"), table_name="projects")
    op.drop_index(op.f("ix_projects_sector"), table_name="projects")
    op.drop_index(op.f("ix_projects_name"), table_name="projects")
    op.drop_table("projects")
