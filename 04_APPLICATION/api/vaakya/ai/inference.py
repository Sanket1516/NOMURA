"""Client for the inference service (OCR, speech). The service itself is built in Step 6."""
from __future__ import annotations

import httpx

from ..core.errors import ServiceUnavailable


class InferenceClient:
    def __init__(self, base_url: str, token: str | None):
        self.c = httpx.Client(base_url=base_url, timeout=httpx.Timeout(120, connect=3), headers={"x-inference-token": token or ""})

    def _post(self, path: str, **kw) -> httpx.Response:
        try:
            r = self.c.post(path, **kw)
        except httpx.HTTPError as e:
            raise ServiceUnavailable("The speech and OCR service is not reachable.") from e
        if r.status_code == 503:
            raise ServiceUnavailable(r.json().get("detail", "Engine not available on this server."))
        r.raise_for_status()
        return r

    def ocr(self, data: bytes, mime: str, lang: str = "eng+hin+mar+kan") -> str:
        return self._post("/ocr", files={"image": ("img", data, mime)}, data={"lang": lang}).json()["text"]
