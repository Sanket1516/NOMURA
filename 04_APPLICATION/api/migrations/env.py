from alembic import context
from sqlalchemy import engine_from_config, pool

from vaakya.config import get_settings
from vaakya.models import Base

config = context.config
_s = get_settings()
config.set_main_option("sqlalchemy.url", (_s.admin_database_url or _s.database_url).replace("%", "%%"))
target_metadata = Base.metadata


def run() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


run()
