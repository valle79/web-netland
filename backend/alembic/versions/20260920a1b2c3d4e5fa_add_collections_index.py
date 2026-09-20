"""add composite collection index on installments

Revision ID: 20260920a1b2c3d4e5fa
Revises: 20260918a1b2c3d4e5f9
Create Date: 2026-09-20 00:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op


revision: str = '20260920a1b2c3d4e5fa'
down_revision: Union[str, None] = '20260918a1b2c3d4e5f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Índice compuesto para las consultas de cobranza que filtran por
    # plan + estado + fecha de vencimiento (deuda vencida, próximo vencimiento).
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_installments_financing_status_due "
        "ON installments (financing_plan_id, status, due_date)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_installments_financing_status_due")