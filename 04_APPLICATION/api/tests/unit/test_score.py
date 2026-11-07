from vaakya.domain import score as s


def test_zero_activity_is_zero_and_building():
    d = s.dimensions(s.ScoreInputs())
    assert set(d) == {"literacy", "safety", "goal_planning", "scheme_awareness", "savings_discipline", "debt_awareness"}
    assert s.overall(d) == 0 and s.band(0) == "Building"


def test_full_marks():
    i = s.ScoreInputs(quiz_correct=10, quiz_total=10, modules_completed=set(s.CORE_MODULES), safety_quiz_correct=5,
                      safety_quiz_total=5, scam_checks=9, has_priority_goal_with_plan=True, goals_total=2, goals_on_track=2,
                      schemes_likely_eligible=3, schemes_reviewed=3, scheme_application_started=True,
                      saving_months_met_last3=3, saving_months_known=3, loan_cost_checked=True, emi_to_income_pct=10)
    d = s.dimensions(i)
    assert all(v == 100 for v in d.values()), d
    assert s.overall(d) == 100 and s.band(100) == "Excellent"


def test_caps_prevent_farming():
    a = s.dimensions(s.ScoreInputs(scam_checks=5))["safety"]
    b = s.dimensions(s.ScoreInputs(scam_checks=500))["safety"]
    assert a == b == 20


def test_weights_and_rounding():
    i = s.ScoreInputs(quiz_correct=3, quiz_total=4, modules_completed={"emergency-fund", "smart-budgeting", "digital-safety"})
    d = s.dimensions(i)
    assert d["literacy"] == 65   # 0.6×0.75 + 0.4×0.5 = 0.65
    assert d["safety"] == 30     # Digital Safety lesson only
    assert s.overall({"a": 62, "b": 63}) == 63  # 62.5 rounds half up, matching the web client


def test_unknown_emi_does_not_award_points_and_band_edges():
    assert s.dimensions(s.ScoreInputs(emi_to_income_pct=None))["debt_awareness"] == 0
    assert s.dimensions(s.ScoreInputs(emi_to_income_pct=39.9))["debt_awareness"] == 20
    assert [s.band(x) for x in (49, 50, 69, 70, 84, 85)] == ["Building", "Fair", "Fair", "Good", "Good", "Excellent"]


def test_actions_target_weakest_dimensions():
    d = {"literacy": 80, "safety": 10, "goal_planning": 50, "scheme_awareness": 0, "savings_discipline": 90, "debt_awareness": 30}
    assert [a["dimension"] for a in s.actions(d)] == ["scheme_awareness", "safety", "debt_awareness"]


def test_overall_matches_the_spec_example():
    """Spec example: 82, 90, 75, 68, 76 gives 78. The mean is taken over however many dimensions exist (six since D-035)."""
    from vaakya.domain.score import overall
    assert overall({"a": 82, "b": 90, "c": 75, "d": 68, "e": 76}) == 78
