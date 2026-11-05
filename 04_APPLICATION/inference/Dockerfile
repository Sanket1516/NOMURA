# VAAKYA inference service. Ubuntu packages: tesseract-ocr (Apache-2.0) with eng/hin/mar/kan data, espeak-ng (GPLv3, separate process).
ARG BASE=nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04
FROM ${BASE}
ARG HTTPS_PROXY
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1
RUN grep -qs universe /etc/apt/sources.list.d/ubuntu.sources || printf 'deb http://archive.ubuntu.com/ubuntu noble main universe\ndeb http://archive.ubuntu.com/ubuntu noble-updates main universe\ndeb http://security.ubuntu.com/ubuntu noble-security main universe\n' > /etc/apt/sources.list
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin tesseract-ocr-mar tesseract-ocr-kan espeak-ng ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /srv/requirements.txt
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export PIP_CERT=/run/secrets/ca; fi; \
    python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r /srv/requirements.txt
COPY app.py /srv/app.py
RUN useradd --create-home --uid 10002 inference \
 && mkdir -p /models/whisper \
 && chown -R inference:inference /models
USER inference
WORKDIR /srv
EXPOSE 8100
HEALTHCHECK --interval=20s --timeout=5s CMD /opt/venv/bin/python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8100/health')"
CMD ["/opt/venv/bin/uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8100"]
