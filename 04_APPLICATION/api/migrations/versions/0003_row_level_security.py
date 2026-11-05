"""Row Level Security on every user-owned table (SECURITY_ARCHITECTURE §3, second line of defence).

The API connects as a member of `vaakya_app` (not the owner, not a superuser), so policies apply. Each request runs
`set_config('vaakya.user_id', <id>, true)` after verifying the token; rows of other users are invisible and cannot be written.
`users` and `schemes` are exempt: users is looked up by Keycloak subject before the id is known, schemes is public.

Revision ID: 0003
Revises: 0002
"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

TABLES = ["profiles", "preferences", "consents", "questionnaire_responses", "financial_items", "goals", "plans", "goal_contributions",
          "conversations", "messages", "documents", "extracted_fields", "sentinel_checks", "learning_progress", "quiz_attempts",
          "score_history", "notifications", "events", "outbox", "dataflow_audit"]
POLICY = "user_id = NULLIF(current_setting('vaakya.user_id', true), '')::uuid"


def upgrade() -> None:
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vaakya_app') THEN CREATE ROLE vaakya_app NOLOGIN; END IF; END $$")
    op.execute("GRANT USAGE ON SCHEMA public TO vaakya_app")
    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vaakya_app")
    op.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vaakya_app")
    op.execute("REVOKE ALL ON alembic_version FROM vaakya_app")
    op.execute("GRANT SELECT ON alembic_version TO vaakya_app")
    for t in TABLES:
        op.execute(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {t} FORCE ROW LEVEL SECURITY")
        op.execute(f"CREATE POLICY owner_only ON {t} USING ({POLICY}) WITH CHECK ({POLICY})")


def downgrade() -> None:
    for t in TABLES:
        op.execute(f"DROP POLICY IF EXISTS owner_only ON {t}")
        op.execute(f"ALTER TABLE {t} NO FORCE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {t} DISABLE ROW LEVEL SECURITY")
