# VAAKYA inference service. Ubuntu packages: tesseract-ocr (Apache-2.0) with eng/hin/mar/kan data, espeak-ng (GPLv3, separate process).
FROM ubuntu:24.04
ARG HTTPS_PROXY
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin tesseract-ocr-mar tesseract-ocr-kan espeak-ng ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /srv/requirements.txt
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export PIP_CERT=/run/secrets/ca; fi; \
    python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r /srv/requirements.txt
COPY app.py /srv/app.py
RUN useradd --create-home --uid 10002 inference
USER inference
WORKDIR /srv
EXPOSE 8100
HEALTHCHECK --interval=20s --timeout=5s CMD /opt/venv/bin/python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8100/health')"
CMD ["/opt/venv/bin/uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8100"]
