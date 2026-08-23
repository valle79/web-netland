"""add_quote_additional_fields

Revision ID: 576db9da025b
Revises: 6d3613e07795
Create Date: 2026-08-23 21:08:09.875452+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '576db9da025b'
down_revision: Union[str, None] = '6d3613e07795'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to quotes table
    op.add_column('quotes', sa.Column('discount_type', sa.String(20), nullable=True))  # 'percentage' or 'amount'
    op.add_column('quotes', sa.Column('discount_value', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('quotes', sa.Column('payment_type', sa.String(20), nullable=True, server_default='credit'))  # 'cash' or 'credit'
    op.add_column('quotes', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('quotes', sa.Column('client_name', sa.String(200), nullable=True))
    op.add_column('quotes', sa.Column('client_phone', sa.String(50), nullable=True))
    op.add_column('quotes', sa.Column('client_email', sa.String(200), nullable=True))


def downgrade() -> None:
    # Remove columns
    op.drop_column('quotes', 'client_email')
    op.drop_column('quotes', 'client_phone')
    op.drop_column('quotes', 'client_name')
    op.drop_column('quotes', 'notes')
    op.drop_column('quotes', 'payment_type')
    op.drop_column('quotes', 'discount_value')
    op.drop_column('quotes', 'discount_type')