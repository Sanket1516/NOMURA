"""Build optional subsystems from settings. Each is registered only when its service is configured."""
from __future__ import annotations

import structlog

from .config import get_settings
from .features import Features


def build_features() -> Features:
    s = get_settings()
    f = Features()
    log = structlog.get_logger()
    if s.s3_endpoint and s.s3_access_key and s.s3_secret_key and s.vault_kek_b64:
        from .stores.vault import EnvelopeCipher, S3Vault
        f.vault = S3Vault(s.s3_endpoint, s.s3_access_key, s.s3_secret_key, EnvelopeCipher.from_b64(s.vault_kek_b64))
        try:
            f.vault.ensure_bucket()
        except Exception:  # noqa: BLE001 - readiness reports it; uploads fail with 503 until storage is up
            log.warning("vault_unreachable", feature="vault")
    if s.neo4j_uri and s.neo4j_password:
        from .stores.graph import GraphGateway
        f.graph = GraphGateway(s.neo4j_uri, s.neo4j_user, s.neo4j_password)
        try:
            f.graph.init_schema()
        except Exception:  # noqa: BLE001
            log.warning("graph_unreachable", feature="graph")
    return f  # Steps 4-6 add: orchestrator, sentinel, connector, speech
