"""Build optional subsystems from settings. Each is registered only when its service is configured."""
from __future__ import annotations

from .config import get_settings
from .features import Features


def build_features() -> Features:
    get_settings()
    return Features()  # Steps 3-6 add: vault, graph, orchestrator, sentinel, connector, speech
