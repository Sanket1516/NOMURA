"""Build subsystems from settings. Optional services are registered only when configured; agents always are,
because their core work is deterministic (calculators, signals, eligibility). Missing pieces degrade honestly."""
from __future__ import annotations

import structlog

from .config import get_settings
from .features import Features


def build_agents(f: Features, llm=None, knowledge=None, ocr=None) -> None:
    from .agents.connector_agent import Connector
    from .agents.educator import Educator
    from .agents.orchestrator import Orchestrator
    from .agents.sentinel_agent import Sentinel
    from .agents.strategy import StrategyBuilder
    from .services.connector import ConnectorService
    from .services.sentinel import SentinelService
    f.sentinel = SentinelService(knowledge=knowledge, ocr=ocr, llm=llm)
    f.connector = ConnectorService()
    f.orchestrator = Orchestrator({"educator": Educator(), "strategy": StrategyBuilder(), "sentinel": Sentinel(f.sentinel),
                                   "connector": Connector(f.connector)}, graph=f.graph, llm=llm, knowledge=knowledge)


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
    knowledge = None
    if s.qdrant_url:
        from .ai.knowledge import COLLECTION, KnowledgeStore
        knowledge = KnowledgeStore(s.qdrant_url)
        try:
            knowledge.ensure()
            if knowledge.client.count(COLLECTION).count == 0:
                knowledge.ingest()
        except Exception:  # noqa: BLE001
            log.warning("knowledge_unreachable", feature="knowledge")
    from .ai.llm import from_settings
    llm = from_settings(s.ollama_url, s.llm_private_model, s.llm_reasoning_model)
    ocr = None
    if s.inference_url:
        from .ai.inference import InferenceClient
        f.speech = InferenceClient(s.inference_url, s.inference_token)
        ocr = f.speech.ocr
    try:
        from .db import session_factory
        from .models import Scheme
        from .seed import load_schemes
        with session_factory()() as db:
            if db.query(Scheme).count() == 0:
                load_schemes(db)
                db.commit()
    except Exception:  # noqa: BLE001
        log.warning("scheme_catalogue_not_loaded", feature="connector")
    build_agents(f, llm=llm, knowledge=knowledge, ocr=ocr)
    return f
