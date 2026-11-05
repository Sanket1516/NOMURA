from vaakya.services.extraction import extract

SLIP = "Salary Slip for October 2026\nGross Salary: Rs 41,500.00\nNet Pay: Rs 35,000.00\n"


class FakeOcr:
    """Stands in for the inference service in this API-level test (real OCR is covered by the inference tests and live E2E)."""
    def __init__(self, text):
        self.text = text

    def ocr(self, data, mime, lang="eng"):
        return self.text


def _png():
    import io

    from PIL import Image
    b = io.BytesIO()
    Image.new("RGB", (40, 40), "white").save(b, "PNG")
    return b.getvalue()


def test_upload_extract_confirm_replaces_previous_slip(app, onboarded):
    from .test_isolation_limits_uploads import MemVault
    app.state.features.vault = MemVault()
    app.state.features.speech = FakeOcr(SLIP)
    try:
        ids = []
        for net in ("35,000.00", "36,500.00"):
            app.state.features.speech = FakeOcr(SLIP.replace("35,000.00", net))
            d = onboarded.post("/v1/documents", files={"file": ("s.png", _png(), "image/png")}, data={"kind": "salary_slip"}).json()
            assert d["status"] == "pending_review" and {f["field"] for f in d["fields"]} == {"net_monthly_income", "gross_monthly_income", "pay_month"}
            ids.append(d["id"])
            fields = [{"field": f["field"], "value": f["value"] if f["field"] == "pay_month" else {"paise": f["value"]["paise"]}} for f in d["fields"]]
            assert onboarded.post(f"/v1/documents/{d['id']}/confirm", json={"fields": fields[:1]}).status_code == 422  # every field must be confirmed
            r = onboarded.post(f"/v1/documents/{d['id']}/confirm", json={"fields": fields})
            assert r.status_code == 200 and r.json()["items_created"] == ["income"]
        salary = [i for i in onboarded.get("/v1/financial-items?kind=income").json() if i["source"] == "document"]
        assert len(salary) == 1 and salary[0]["amount"]["paise"] == 3_650_000  # latest slip only, never double-counted
        assert onboarded.post(f"/v1/documents/{ids[0]}/confirm", json={"fields": [{"field": "net_monthly_income", "value": {"paise": -1}}]}).status_code == 422
    finally:
        app.state.features.vault = None
        app.state.features.speech = None


def test_extraction_without_ocr_keeps_file_and_explains(app, onboarded):
    from .test_isolation_limits_uploads import MemVault
    app.state.features.vault = MemVault()
    try:
        d = onboarded.post("/v1/documents", files={"file": ("s.png", _png(), "image/png")}, data={"kind": "salary_slip"}).json()
        assert d["status"] == "extraction_failed" and "OCR" in d["extraction_error"]
    finally:
        app.state.features.vault = None


def test_extract_rules_smoke():
    assert extract("salary_slip", SLIP)[0]["value"]["paise"] == 3_500_000
