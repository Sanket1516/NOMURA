"""ASGI entry point: `uvicorn vaakya.asgi:app`. Subsystems are registered here as later steps add them."""
from .bootstrap import build_features
from .main import create_app

app = create_app(build_features())
