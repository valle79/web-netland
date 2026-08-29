"""add_m2_and_surcharge_pricing

Revision ID: c8f5a2e0d1b4
Revises: 576db9da025b
Create Date: 2026-08-29 12:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8f5a2e0d1b4'
down_revision: Union[str, None] = '576db9da025b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Lotes: precio por m2 (referencia/informativo)
    op.add_column('lots', sa.Column('price_per_m2', sa.Numeric(precision=12, scale=2), nullable=True))

    # Cotizaciones: precio por m2 y recargos de ubicación
    op.add_column('quotes', sa.Column('price_per_m2', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('quotes', sa.Column('esquina_surcharge', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('quotes', sa.Column('frente_parque_surcharge', sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column('quotes', 'frente_parque_surcharge')
    op.drop_column('quotes', 'esquina_surcharge')
    op.drop_column('quotes', 'price_per_m2')
    op.drop_column('lots', 'price_per_m2')
