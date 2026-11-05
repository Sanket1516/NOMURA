"""Optional subsystems, registered at startup when configured (Steps 3 to 6).
An endpoint whose subsystem is missing returns 503 with the reason. Nothing is mocked."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Request

from .core.errors import ServiceUnavailable


@dataclass
class Features:
    vault: Any = None          # DocumentVault (SeaweedFS), Step 3
    graph: Any = None          # GraphGateway (Neo4j), Step 3
    orchestrator: Any = None   # LangGraph orchestrator, Steps 4-5
    sentinel: Any = None       # Sentinel agent pipeline, Step 5
    connector: Any = None      # Connector agent / eligibility, Step 5
    speech: Any = None         # Speech adapter (inference service), Step 6


def features(request: Request) -> Features:
    return request.app.state.features


def need(obj: Any, what: str) -> Any:
    if obj is None:
        raise ServiceUnavailable(f"{what} is not available on this server yet.", title="Feature not available")
    return obj
