"""add composite indexes for lots and contracts lists

Revision ID: 20260920a1b2c3d4e5fb
Revises: 20260920a1b2c3d4e5fa
Create Date: 2026-09-20 00:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op


revision: str = '20260920a1b2c3d4e5fb'
down_revision: Union[str, None] = '20260920a1b2c3d4e5fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ordenamiento del listado de lotes paginado (manzana + número + código)
    # y del listado de contratos (estado + fecha de creación).
    op.create_index(
        "ix_lots_project_block_number", "lots", ["project_id", "block_id", "lot_number"]
    )
    op.create_index(
        "ix_contracts_status_created_at", "contracts", ["status", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_contracts_status_created_at", table_name="contracts")
    op.drop_index("ix_lots_project_block_number", table_name="lots")