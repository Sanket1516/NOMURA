"""PostgreSQL Row Level Security as a restricted role: other users' rows are invisible and cannot be written."""
import uuid

import pytest
from sqlalchemy import create_engine, text

from ..conftest import ADMIN_URL


@pytest.fixture
def two_users(app, alice, bob):
    from ..conftest import PROFILE
    for api, name in ((alice, "Alice"), (bob, "Bob")):
        api.put("/v1/me/profile", json={**PROFILE, "display_name": name})
    with create_engine(ADMIN_URL).begin() as c:
        c.execute(text("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vaakya_rls_probe') THEN "
                       "CREATE ROLE vaakya_rls_probe LOGIN PASSWORD 'probe' IN ROLE vaakya_app; END IF; END $$"))
        ids = dict(c.execute(text("SELECT display_name, user_id FROM profiles")).all())
    return ids


def probe():
    return create_engine(ADMIN_URL.replace("postgres:test@", "vaakya_rls_probe:probe@"))


def test_policies_hide_other_users_rows(two_users):
    with probe().begin() as c:
        assert c.execute(text("SELECT count(*) FROM profiles")).scalar() == 0  # no user set: nothing visible
        c.execute(text("SELECT set_config('vaakya.user_id', :u, true)"), {"u": str(two_users["Alice"])})
        assert c.execute(text("SELECT display_name FROM profiles")).scalars().all() == ["Alice"]
        assert c.execute(text("SELECT count(*) FROM events WHERE user_id = :b"), {"b": two_users["Bob"]}).scalar() == 0
        assert c.execute(text("UPDATE profiles SET display_name = 'x' WHERE user_id = :b"), {"b": two_users["Bob"]}).rowcount == 0


def test_policies_block_writing_as_someone_else(two_users):
    with probe().connect() as c:
        tx = c.begin()
        c.execute(text("SELECT set_config('vaakya.user_id', :u, true)"), {"u": str(two_users["Alice"])})
        with pytest.raises(Exception) as e:
            c.execute(text("INSERT INTO notifications (id, user_id, kind, title, body, created_at) VALUES (:i, :b, 'system', 't', 'b', now())"),
                      {"i": uuid.uuid4(), "b": two_users["Bob"]})
        assert "row-level security" in str(e.value)
        tx.rollback()


def test_rls_is_forced_on_every_user_table(app):
    with create_engine(ADMIN_URL).connect() as c:
        rows = c.execute(text("SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = ANY(:t)"),
                         {"t": ["profiles", "goals", "events", "documents", "messages", "sentinel_checks", "score_history", "outbox"]}).all()
    assert len(rows) == 8 and all(r[1] and r[2] for r in rows)
