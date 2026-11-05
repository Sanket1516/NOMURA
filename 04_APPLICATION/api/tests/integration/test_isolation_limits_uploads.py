import io
from datetime import date

from PIL import Image

from vaakya import ratelimit


def _goal(api):
    return api.post("/v1/goals", json={"type": "home", "title": "Home", "target": {"paise": 10_000_000}, "target_date": "2031-01-01"}).json()["id"]


def test_cross_user_access_is_404(onboarded, bob, client):
    gid = _goal(onboarded)
    item = onboarded.post("/v1/financial-items", json={"kind": "expense", "label": "Rent", "amount": {"paise": 1_100_000},
                                                       "on_date": date.today().isoformat()}).json()["id"]
    for method, path, kw in [("get", f"/v1/goals/{gid}", {}), ("patch", f"/v1/goals/{gid}", {"json": {"title": "mine"}}),
                             ("delete", f"/v1/goals/{gid}", {}), ("get", f"/v1/goals/{gid}/plan", {}),
                             ("patch", f"/v1/financial-items/{item}", {"json": {"label": "x"}}), ("delete", f"/v1/financial-items/{item}", {})]:
        assert getattr(bob, method)(path, **kw).status_code == 404, (method, path)
    assert bob.get("/v1/goals").json() == []
    assert bob.get("/v1/financial-items").json() == []
    assert onboarded.get(f"/v1/goals/{gid}").status_code == 200  # untouched


def test_rate_limit_returns_429_with_retry_after(alice):
    ratelimit.LIMITS["write"] = (3, 3600)
    try:
        codes = [alice.put("/v1/me/preferences", json={}).status_code for _ in range(4)]
        assert codes == [200, 200, 200, 429]
        r = alice.put("/v1/me/preferences", json={})
        assert int(r.headers["retry-after"]) > 0 and r.json()["type"].endswith("/rate-limited")
    finally:
        ratelimit.LIMITS["write"] = (300, 3600)


def test_ai_endpoints_report_unavailable_not_fake(onboarded):
    for method, path, kw in [("post", "/v1/chat", {"json": {"message": "What is SIP?"}}), ("get", "/v1/schemes", {}),
                             ("post", "/v1/sentinel/checks", {"json": {"text": "Share OTP"}})]:
        r = getattr(onboarded, method)(path, **kw)
        assert r.status_code == 503 and r.json()["title"] == "Feature not available", path


class MemVault:
    def __init__(self):
        self.objects = {}

    def put(self, key, data, mime):
        self.objects[key] = data

    def get(self, key):
        return self.objects[key]

    def delete(self, key):
        self.objects.pop(key, None)

    def delete_prefix(self, prefix):
        keys = [k for k in self.objects if k.startswith(prefix)]
        for k in keys:
            del self.objects[k]
        return len(keys)


def _jpeg_with_gps() -> bytes:
    img = Image.new("RGB", (40, 30), "white")
    exif = Image.Exif()
    exif[0x8825] = {2: (18.0, 31.0, 0.0)}  # GPSInfo
    exif[0x010F] = "PhoneMaker"
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=exif)
    return buf.getvalue()


def test_upload_validation_and_metadata_stripping(app, onboarded):
    vault = MemVault()
    app.state.features.vault = vault
    try:
        raw = _jpeg_with_gps()
        assert Image.open(io.BytesIO(raw)).getexif()
        r = onboarded.post("/v1/documents", files={"file": ("slip.jpg", raw, "image/jpeg")}, data={"kind": "salary_slip"})
        assert r.status_code == 202, r.text
        stored = next(iter(vault.objects.values()))
        assert not Image.open(io.BytesIO(stored)).getexif()  # EXIF and GPS removed
        key = next(iter(vault.objects))
        me = onboarded.get("/v1/me").json()["user_id"]
        assert key.startswith(f"{me}/") and key.endswith(r.json()["id"]) and "slip" not in key
        # Wrong magic bytes, even with an image extension and type.
        bad = onboarded.post("/v1/documents", files={"file": ("x.png", b"MZ\x90\x00 not an image", "image/png")}, data={"kind": "other"})
        assert bad.status_code == 415
        # Too large.
        big = onboarded.post("/v1/documents", files={"file": ("big.png", b"\x89PNG\r\n\x1a\n" + b"0" * (10 * 1024 * 1024), "image/png")})
        assert big.status_code == 413
        # PDF with JavaScript.
        js_pdf = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R/OpenAction 3 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n3 0 obj<</S/JavaScript/JS(app.alert(1))>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"
        assert onboarded.post("/v1/documents", files={"file": ("a.pdf", js_pdf, "application/pdf")}).status_code == 415
        assert onboarded.post("/v1/documents", files={"file": ("x.jpg", raw, "image/jpeg")}, data={"kind": "passport"}).status_code == 422
        assert len(onboarded.get("/v1/documents").json()) == 1
    finally:
        app.state.features.vault = None


def test_upload_needs_consent_and_storage(app, alice):
    app.state.features.vault = MemVault()
    try:
        r = alice.post("/v1/documents", files={"file": ("x.jpg", _jpeg_with_gps(), "image/jpeg")})
        assert r.status_code == 409 and r.json()["purpose"] == "document_storage"
    finally:
        app.state.features.vault = None
