"""add_plan_pdf_url_to_projects

Revision ID: 7eb3301316d5
Revises: 
Create Date: 2026-08-22 12:35:51.275330+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7eb3301316d5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregar columna plan_pdf_url a la tabla projects
    op.add_column('projects', sa.Column('plan_pdf_url', sa.String(length=500), server_default='', nullable=True))


def downgrade() -> None:
    # Eliminar columna plan_pdf_url de la tabla projects
    op.drop_column('projects', 'plan_pdf_url')