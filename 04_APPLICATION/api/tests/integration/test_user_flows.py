from datetime import date, timedelta

from ..conftest import ANSWERS, PROFILE


def test_consent_is_append_only_and_latest_wins(alice):
    g = lambda granted: {"grants": [{"purpose": "voice_processing", "version": "2026-11", "granted": granted}]}  # noqa: E731
    alice.put("/v1/me/consents", json=g(True))
    r = alice.put("/v1/me/consents", json=g(False)).json()
    assert [c["granted"] for c in r if c["purpose"] == "voice_processing"] == [False]


def test_consent_records_the_language_it_was_shown_in(alice):
    """KI-18: the language is stored with the grant, never guessed; a missing language stays null."""
    one = lambda lang: {"grants": [{"purpose": "voice_processing", "version": "2026-11", "granted": True, **({"lang": lang} if lang else {})}]}  # noqa: E731
    r = alice.put("/v1/me/consents", json=one("mr")).json()
    assert [c["lang"] for c in r if c["purpose"] == "voice_processing"] == ["mr"]
    r = alice.put("/v1/me/consents", json=one(None)).json()
    assert [c["lang"] for c in r if c["purpose"] == "voice_processing"] == [None]
    assert alice.put("/v1/me/consents", json=one("fr")).status_code == 422


def test_assessment_is_dynamic_and_validated(alice):
    alice.put("/v1/me/profile", json={**PROFILE, "income_type": "seasonal"})
    q = alice.get("/v1/assessment/next").json()
    assert q["question"]["id"] == "monthly_income" and q["total_steps"] == 7  # seasonal adds the harvest question
    bad = alice.post("/v1/assessment/answers", json={"answers": [{"question_id": "monthly_income", "value": {"min_paise": 5, "max_paise": 1}}]})
    assert bad.status_code == 422
    r = alice.post("/v1/assessment/answers", json={"answers": ANSWERS[:2]}).json()
    assert r["question"]["id"] == "loan_emi"


def test_complete_requires_profile_and_all_answers(alice):
    assert alice.post("/v1/assessment/complete").status_code == 409
    alice.put("/v1/me/profile", json=PROFILE)
    r = alice.post("/v1/assessment/complete")
    assert r.status_code == 409 and "monthly_income" in r.json()["missing"]


def test_baseline_score_after_assessment(onboarded):
    s = onboarded.get("/v1/score").json()
    assert s["formula_version"] == "fcs-1" and len(s["dimensions"]) == 6
    dims = {d["key"]: d["score"] for d in s["dimensions"]}
    assert dims["debt_awareness"] == 20  # only "EMIs under 40% of income" is true so far
    assert s["overall"] == round(sum(dims.values()) / 6)
    assert s["not_a_credit_score"] is True and "Score" in s["text_equivalent"]


def test_goal_lifecycle_with_plan_and_contribution(onboarded):
    target_date = (date.today() + timedelta(days=700)).isoformat()
    r = onboarded.post("/v1/goals", json={"type": "emergency_fund", "title": "Emergency fund", "target": {"paise": 15_600_000},
                                          "target_date": target_date, "priority": 1}, headers={"idempotency-key": "k1"})
    assert r.status_code == 201, r.text
    goal = r.json()
    assert goal["monthly_plan"]["paise"] > 0 and goal["progress_pct"] == 0
    # Idempotent retry returns the same goal, no duplicate.
    again = onboarded.post("/v1/goals", json={"type": "emergency_fund", "title": "Emergency fund", "target": {"paise": 15_600_000},
                                              "target_date": target_date, "priority": 1}, headers={"idempotency-key": "k1"})
    assert again.status_code == 200 and again.json()["id"] == goal["id"]
    assert len(onboarded.get("/v1/goals").json()) == 1
    plan = onboarded.get(f"/v1/goals/{goal['id']}/plan").json()
    assert plan["feasibility"] in {"achievable", "stretch"} and plan["assumptions"] and plan["inputs"]["monthly_income_paise"] == 3_500_000
    c = onboarded.post(f"/v1/goals/{goal['id']}/contributions", json={"amount": {"paise": 500_000}, "on_date": date.today().isoformat()})
    assert c.status_code == 200 and c.json()["saved"]["paise"] == 500_000
    assert onboarded.post(f"/v1/goals/{goal['id']}/contributions", json={"amount": {"paise": 1}, "on_date": "2999-01-01"}).status_code == 422
    assert onboarded.delete(f"/v1/goals/{goal['id']}").status_code == 204
    assert onboarded.get(f"/v1/goals/{goal['id']}").status_code == 404


def test_goal_validation(onboarded):
    assert onboarded.post("/v1/goals", json={"type": "home", "title": "Home", "target": {"paise": 100}, "target_date": "2020-01-01"}).status_code == 422
    assert onboarded.post("/v1/goals", json={"type": "boat", "title": "x", "target": {"paise": 100}, "target_date": "2030-01-01"}).status_code == 422
    assert onboarded.post("/v1/goals", json={"type": "home", "title": "x", "target": {"paise": -5}, "target_date": "2030-01-01"}).status_code == 422


def test_plan_requires_assessment(alice):
    alice.put("/v1/me/profile", json=PROFILE)
    r = alice.post("/v1/goals", json={"type": "home", "title": "Home", "target": {"paise": 100_000}, "target_date": "2030-01-01"})
    assert r.status_code == 409


def test_budget_items_and_summary(onboarded):
    month = date.today().strftime("%Y-%m")
    add = onboarded.post("/v1/financial-items", json={"kind": "expense", "label": "Groceries", "category": "food", "amount": {"paise": 420_000},
                                                      "on_date": date.today().isoformat()})
    assert add.status_code == 201
    b = onboarded.get(f"/v1/budget?month={month}").json()
    assert b["income"]["paise"] == 3_500_000
    assert b["expenses"]["paise"] == 2_600_000 + 420_000
    assert b["left"]["paise"] == 3_500_000 - 3_020_000
    item_id = add.json()["id"]
    assert onboarded.patch(f"/v1/financial-items/{item_id}", json={"amount": {"paise": 0}}).status_code == 422
    assert onboarded.patch(f"/v1/financial-items/{item_id}", json={"amount": {"paise": 100_000}}).json()["amount"]["display"] == "₹1,000"
    assert onboarded.get("/v1/budget?month=2026-13").status_code == 422
    assert onboarded.delete(f"/v1/financial-items/{item_id}").status_code == 204


def test_variable_income_budget_has_saving_rule(alice):
    alice.put("/v1/me/profile", json={**PROFILE, "income_type": "variable"})
    alice.post("/v1/assessment/answers", json={"answers": [{"question_id": "monthly_income", "value": {"min_paise": 1_500_000, "max_paise": 4_000_000}},
                                                           *ANSWERS[1:]]})
    alice.post("/v1/assessment/complete")
    rule = alice.get("/v1/budget").json()["saving_rule"]
    assert rule["figures"]["lean_month_paise"] == 1_500_000 and rule["figures"]["monthly_floor_paise"] > 0


def test_planning_calculators(alice):
    r = alice.post("/v1/planning/loan-cost", json={"principal": {"paise": 1_000_000}, "emi": {"paise": 400_000}, "months": 3,
                                                   "upfront_fees": {"paise": 200_000}})
    assert r.status_code == 200 and r.json()["figures"]["high_cost"] is True
    assert alice.post("/v1/planning/loan-cost", json={"principal": {"paise": 1_000_000}, "emi": {"paise": 100}, "months": 2}).status_code == 422
    sip = alice.post("/v1/planning/sip-illustration", json={"monthly": {"paise": 100_000}, "months": 12, "assumed_annual_return_pct": 12}).json()
    assert sip["figures"]["illustrated_value_paise"] == 1_280_933 and any("not guaranteed" in x for x in sip["limitations"])
    assert alice.post("/v1/planning/seasonal", json={"harvest_income": {"paise": 12_000_000}, "months_until_next_harvest": 13,
                                                     "monthly_expenses": {"paise": 1}, "next_season_input_cost": {"paise": 1}}).status_code == 422


def test_learning_quiz_updates_score_and_hides_answers(onboarded):
    m = onboarded.get("/v1/learning/modules/digital-safety").json()
    assert "answer" not in m["quiz"][0] and m["content_status"] == "draft_unreviewed"
    before = onboarded.get("/v1/score").json()["overall"]
    assert onboarded.post("/v1/learning/modules/digital-safety/quiz-attempts", json={"answers": {"q1": 1}}).status_code == 422
    r = onboarded.post("/v1/learning/modules/digital-safety/quiz-attempts", json={"answers": {"q1": 1, "q2": 1, "q3": 0, "q4": 0}}).json()
    assert r["correct"] == 3 and r["total"] == 4 and r["gaps"]
    after = onboarded.get("/v1/score").json()
    safety = next(d for d in after["dimensions"] if d["key"] == "safety")["score"]
    assert safety == 68  # 0.5×0.75 + 0.3×1 + 0.2×0 = 0.675 → 68
    assert after["overall"] > before
    assert onboarded.get("/v1/learning/modules/nope").status_code == 404


def test_dashboard_matches_client_shape(onboarded):
    d = onboarded.get("/v1/dashboard").json()
    for key in ("profile", "score", "snapshot", "savings", "goals", "entries", "activity", "recommendations", "scam_alerts", "learning",
                "notifications", "schemes"):
        assert key in d, key
    assert d["snapshot"]["monthly_income"]["display"] == "₹35,000"
    assert len(d["savings"]["trend"]) == 6 and d["recommendations"]


def test_dashboard_before_onboarding_is_409(alice):
    r = alice.get("/v1/dashboard")
    assert r.status_code == 409 and r.json()["next"] == "/onboarding"


def test_export_and_erase(onboarded):
    e = onboarded.post("/v1/me/export").json()
    assert e["data"]["profiles"][0]["display_name"] == "Priya"
    r = onboarded.delete("/v1/me").json()
    assert r["status"] == "deleted" and r["report"]["remaining_rows"] == 0
    # A fresh token for the same subject provisions a new, empty account.
    assert onboarded.get("/v1/me").json()["profile"] is None
