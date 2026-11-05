# syntax=docker/dockerfile:1
# VAAKYA API image. Built from the frozen lockfile (NFR-MAINT-01).
# Behind a TLS-intercepting proxy: --network host --build-arg HTTPS_PROXY=... --secret id=ca,src=ca.crt
FROM python:3.13-slim AS build
ARG HTTPS_PROXY
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/opt/venv
COPY pyproject.toml uv.lock ./
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export PIP_CERT=/run/secrets/ca SSL_CERT_FILE=/run/secrets/ca; fi; \
    pip install --no-cache-dir uv==0.11.32 && uv sync --frozen --no-dev --no-install-project

FROM python:3.13-slim
RUN useradd --create-home --uid 10001 vaakya
COPY --from=build /opt/venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY --chown=vaakya alembic.ini ./
COPY --chown=vaakya migrations ./migrations
COPY --chown=vaakya vaakya ./vaakya
USER vaakya
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/healthz')"
# Migrations run first; the app factory is served by uvicorn.
CMD ["sh", "-c", "alembic upgrade head && uvicorn vaakya.asgi:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
