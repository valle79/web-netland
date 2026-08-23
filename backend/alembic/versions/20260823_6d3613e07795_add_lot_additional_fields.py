"""add_lot_additional_fields

Revision ID: 6d3613e07795
Revises: 7eb3301316d5
Create Date: 2026-08-23 16:33:45.639309+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6d3613e07795'
down_revision: Union[str, None] = '7eb3301316d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to lots table (lot_number already exists)
    op.add_column('lots', sa.Column('zone', sa.String(), nullable=True))
    op.add_column('lots', sa.Column('location_bonus', sa.String(), nullable=True))
    op.add_column('lots', sa.Column('location_bonus_amount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('lots', sa.Column('normal_price_usd', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('lots', sa.Column('normal_price_soles', sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade() -> None:
    # Remove columns
    op.drop_column('lots', 'normal_price_soles')
    op.drop_column('lots', 'normal_price_usd')
    op.drop_column('lots', 'location_bonus_amount')
    op.drop_column('lots', 'location_bonus')
    op.drop_column('lots', 'zone')