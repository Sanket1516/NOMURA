# syntax=docker/dockerfile:1
# T0.06 spike image: proves the planned API dependency set builds and imports on Linux.
# Not the application image. T1.03 creates that from this lockfile.
#
# Behind a TLS-intercepting proxy, pass its CA as an optional build secret:
#   docker build --network host --build-arg HTTPS_PROXY=$HTTPS_PROXY --secret id=ca,src=/path/ca.crt .
FROM python:3.13-slim
ARG HTTPS_PROXY
WORKDIR /spike
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/opt/venv PATH=/opt/venv/bin:$PATH
COPY pyproject.toml uv.lock ./
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export PIP_CERT=/run/secrets/ca SSL_CERT_FILE=/run/secrets/ca; fi; \
    pip install --no-cache-dir uv==0.11.32 \
 && uv sync --frozen --no-install-project \
 && pip uninstall -y uv
COPY smoke_imports.py licence_check.py service_probe.py ./
RUN useradd --create-home spike
USER spike
CMD ["python", "smoke_imports.py"]
