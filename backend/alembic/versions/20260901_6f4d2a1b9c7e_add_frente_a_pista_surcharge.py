"""add_frente_a_pista_surcharge

Revision ID: 6f4d2a1b9c7e
Revises: c8f5a2e0d1b4
Create Date: 2026-09-01 19:20:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6f4d2a1b9c7e'
down_revision: Union[str, None] = 'c8f5a2e0d1b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Cotizaciones: recargo por lote frente a pista (avenida/calle)
    op.add_column('quotes', sa.Column('frente_a_pista_surcharge', sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column('quotes', 'frente_a_pista_surcharge')