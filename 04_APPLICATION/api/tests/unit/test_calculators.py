from datetime import date

import pytest

from vaakya.domain import calculators as c


def test_emergency_fund_by_income_type():
    assert c.emergency_fund_target(2_600_000, "salaried").figures["target_paise"] == 7_800_000
    assert c.emergency_fund_target(1_900_000, "variable").figures["target_paise"] == 11_400_000
    with pytest.raises(ValueError):
        c.emergency_fund_target(0, "salaried")
    with pytest.raises(ValueError):
        c.emergency_fund_target(100, "unknown")


@pytest.mark.parametrize("target,saved,income,expenses,expected", [
    (15_600_000, 4_200_000, 3_500_000, 2_600_000, "stretch"),
    (15_600_000, 15_600_000, 3_500_000, 2_600_000, "achieved"),
    (15_600_000, 0, 2_000_000, 2_500_000, "no_surplus"),
])
def test_goal_plan_verdicts(target, saved, income, expenses, expected):
    r = c.goal_plan(target, saved, date(2026, 11, 5), date(2028, 10, 31), income, expenses)
    if expected == "stretch":
        # ₹1,14,000 over 23 months = ₹4,957 a month; surplus ₹9,000, comfortable ₹4,500 → stretch
        assert r.figures["months"] == 23
        assert r.figures["monthly_needed_paise"] == 495_653
        assert r.figures["feasibility"] == "stretch"
    else:
        assert r.figures["feasibility"] == expected


def test_goal_plan_not_feasible_suggests_later_date():
    r = c.goal_plan(10_000_000, 0, date(2026, 11, 5), date(2027, 5, 1), 3_000_000, 2_800_000)
    assert r.figures["feasibility"] == "not_feasible_by_date"
    # comfortable = 1,00,000 paise/month → 100 months → 2035-03
    assert r.figures["suggested_date"] == "2035-03-01"


def test_goal_plan_validation_and_milestones():
    with pytest.raises(ValueError):
        c.goal_plan(100, 0, date(2026, 11, 5), date(2026, 1, 1), 1, 1)
    r = c.goal_plan(1_200_000, 0, date(2026, 11, 5), date(2027, 11, 5), 5_000_000, 1_000_000)
    assert r.figures["monthly_needed_paise"] == 100_000
    assert r.figures["milestones"][0] == {"month": "2026-12", "target_saved_paise": 100_000}
    assert r.figures["milestones"][-1]["target_saved_paise"] == 1_200_000
    assert r.assumptions and r.limitations


def test_irregular_income_rule_rajesh():
    r = c.irregular_income_rule([1_500_000, 4_000_000, 2_500_000, 2_200_000, 2_600_000, 2_800_000], 1_900_000, target_rate_pct=12)
    assert r.figures["monthly_floor_paise"] == 180_000  # 12 % of ₹15,000
    assert r.figures["lean_month_paise"] == 1_500_000
    assert r.figures["save_in_good_month_paise"] == 480_000
    auto = c.irregular_income_rule([1_500_000, 4_000_000], 1_900_000)
    assert 10 <= auto.figures["save_rate_pct"] <= 20
    with pytest.raises(ValueError):
        c.irregular_income_rule([1_000_000], 1)


def test_seasonal_plan_kisan():
    r = c.seasonal_plan(12_000_000, 6, 900_000, 3_500_000)
    assert r.figures["household_reserve_paise"] == 5_400_000
    assert r.figures["total_needed_paise"] == 8_900_000
    assert r.figures["left_over_paise"] == 3_100_000
    assert r.figures["covers_until_next_harvest"] is True
    short = c.seasonal_plan(6_000_000, 6, 900_000, 3_500_000)
    assert short.figures["covers_until_next_harvest"] is False


def test_loan_cost_known_rate():
    # ₹1,00,000 over 12 months at 12 % nominal (1 %/month) → EMI ₹8,884.88; effective annual ≈ 12.68 %
    r = c.loan_cost(10_000_000, 888_488, 12)
    assert r.figures["nominal_annual_rate_pct"] == 12.0
    assert r.figures["effective_annual_rate_pct"] == 12.7
    assert r.figures["high_cost"] is False


def test_loan_cost_instant_loan_app_is_high_cost():
    # ₹10,000 'loan', ₹2,000 processing fee deducted, repay ₹1,200 × 10 weeks ≈ 3 months modelled as 3 EMIs of ₹4,000
    r = c.loan_cost(1_000_000, 400_000, 3, upfront_fees_paise=200_000)
    assert r.figures["high_cost"] is True
    assert r.figures["effective_annual_rate_pct"] > 300
    assert r.figures["total_interest_and_fees_paise"] == 400_000
    with pytest.raises(ValueError):
        c.loan_cost(1_000_000, 100, 2)


def test_sip_illustration_matches_closed_form():
    r = c.sip_illustration(100_000, 12, 12)
    # 1000 × ((1.01^12 − 1)/0.01) × 1.01 = 12,809.33 rupees
    assert r.figures["illustrated_value_paise"] == 1_280_933
    assert c.sip_illustration(100_000, 12, 0).figures["illustrated_value_paise"] == 1_200_000
    assert any("not guaranteed" in x for x in r.limitations)
    with pytest.raises(ValueError):
        c.sip_illustration(100_000, 12, 50)
