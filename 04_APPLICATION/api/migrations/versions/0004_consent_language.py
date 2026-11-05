"""Record the interface language shown with each consent (KI-18).

Nullable on purpose: rows written before this migration, and callers that do not send it, stay NULL, which means
"not recorded". Nothing is guessed. Row Level Security on `consents` (0003) already covers the new column.

Revision ID: 0004
Revises: 0003
"""
import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("consents", sa.Column("lang", sa.String(2), nullable=True))
    op.create_check_constraint("consents_lang_valid", "consents", "lang IS NULL OR lang IN ('en','hi','mr','kn')")


def downgrade() -> None:
    op.drop_constraint("consents_lang_valid", "consents", type_="check")
    op.drop_column("consents", "lang")
