"""Deterministic financial calculators (FR-STR-04, D-013). The LLM never computes figures.

Every function returns a Result with the figures, the inputs, the formula in words, the assumptions and the limits,
so the "Why this?" view and the Strategy Builder can show their working. All money is integer paise.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date
from decimal import ROUND_CEILING, ROUND_HALF_UP, Decimal

CALC_VERSION = "calc-1"


@dataclass
class Result:
    figures: dict[str, int | float | str]
    inputs: dict[str, int | float | str]
    formula: str
    assumptions: list[str] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)
    version: str = CALC_VERSION

    def as_dict(self) -> dict:
        return asdict(self)


def _require(cond: bool, msg: str) -> None:
    if not cond:
        raise ValueError(msg)


def months_between(start: date, end: date) -> int:
    """Whole saving months from the month after `start` up to and including `end`'s month."""
    return max((end.year - start.year) * 12 + (end.month - start.month), 0)


def _ceil_div(a: int, b: int) -> int:
    return int((Decimal(a) / Decimal(b)).to_integral_value(rounding=ROUND_CEILING))


def emergency_fund_target(monthly_expenses_paise: int, income_type: str) -> Result:
    """3 months of expenses for steady salaries, 6 for variable or seasonal income."""
    _require(monthly_expenses_paise > 0, "monthly expenses must be positive")
    _require(income_type in {"salaried", "variable", "seasonal"}, "unknown income type")
    months = 3 if income_type == "salaried" else 6
    return Result(
        figures={"target_paise": monthly_expenses_paise * months, "months_of_expenses": months},
        inputs={"monthly_expenses_paise": monthly_expenses_paise, "income_type": income_type},
        formula=f"monthly expenses × {months}",
        assumptions=["Common rule of thumb: 3 months for steady income, 6 months for irregular or seasonal income"],
        limitations=["Families with dependants or health needs may want more"],
    )


def goal_plan(target_paise: int, saved_paise: int, today: date, target_date: date,
              monthly_income_paise: int, monthly_expenses_paise: int, monthly_emi_paise: int = 0) -> Result:
    """Monthly saving needed and whether it is achievable from the monthly surplus."""
    _require(target_paise > 0, "target must be positive")
    _require(saved_paise >= 0, "saved cannot be negative")
    _require(target_date > today, "target date must be in the future")
    _require(monthly_income_paise >= 0 and monthly_expenses_paise >= 0 and monthly_emi_paise >= 0, "amounts cannot be negative")
    remaining = max(target_paise - saved_paise, 0)
    months = max(months_between(today, target_date), 1)
    monthly_needed = _ceil_div(remaining, months) if remaining else 0
    surplus = monthly_income_paise - monthly_expenses_paise - monthly_emi_paise
    comfortable = surplus // 2  # keep half the surplus free for irregular costs
    if remaining == 0:
        verdict, suggested = "achieved", target_date.isoformat()
    elif surplus <= 0:
        verdict, suggested = "no_surplus", ""
    elif monthly_needed <= comfortable:
        verdict, suggested = "achievable", target_date.isoformat()
    elif monthly_needed <= surplus:
        verdict, suggested = "stretch", target_date.isoformat()
    else:
        verdict = "not_feasible_by_date"
        need_months = _ceil_div(remaining, max(comfortable, 1))
        y, m = divmod(today.month - 1 + need_months, 12)
        suggested = date(today.year + y, m + 1, 1).isoformat()
    milestones = []
    acc = saved_paise
    for i in range(1, min(months, 12) + 1):
        acc = min(acc + monthly_needed, target_paise)
        y, m = divmod(today.month - 1 + i, 12)
        milestones.append({"month": f"{today.year + y:04d}-{m + 1:02d}", "target_saved_paise": acc})
    return Result(
        figures={"remaining_paise": remaining, "months": months, "monthly_needed_paise": monthly_needed,
                 "monthly_surplus_paise": surplus, "feasibility": verdict, "suggested_date": suggested, "milestones": milestones},  # type: ignore[dict-item]
        inputs={"target_paise": target_paise, "saved_paise": saved_paise, "today": today.isoformat(), "target_date": target_date.isoformat(),
                "monthly_income_paise": monthly_income_paise, "monthly_expenses_paise": monthly_expenses_paise, "monthly_emi_paise": monthly_emi_paise},
        formula="monthly needed = (target − saved) ÷ months left, rounded up; surplus = income − expenses − EMIs",
        assumptions=["No interest or investment returns are counted", "Income and expenses stay at today's level"],
        limitations=["Does not predict emergencies, job changes or inflation", "'Achievable' keeps half of the surplus free"],
    )


def irregular_income_rule(monthly_incomes_paise: list[int], monthly_expenses_paise: int, target_rate_pct: int | None = None) -> Result:
    """Save a percentage of every payout with a floor based on the leanest month (FR-STR-06)."""
    _require(len(monthly_incomes_paise) >= 2, "give at least two months of income")
    _require(all(x >= 0 for x in monthly_incomes_paise), "income cannot be negative")
    lean, good = min(monthly_incomes_paise), max(monthly_incomes_paise)
    avg = sum(monthly_incomes_paise) // len(monthly_incomes_paise)
    if target_rate_pct is None:
        # Leave expenses covered in an average month; save 10 to 20 %.
        free_pct = 0 if avg == 0 else int(Decimal(max(avg - monthly_expenses_paise, 0) * 100) / Decimal(avg))
        target_rate_pct = max(10, min(20, free_pct // 2))
    _require(0 < target_rate_pct <= 50, "rate must be between 1 and 50 %")
    floor = int((Decimal(lean) * target_rate_pct / 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    return Result(
        figures={"save_rate_pct": target_rate_pct, "monthly_floor_paise": floor, "lean_month_paise": lean, "good_month_paise": good,
                 "average_month_paise": avg, "save_in_average_month_paise": avg * target_rate_pct // 100,
                 "save_in_good_month_paise": good * target_rate_pct // 100},
        inputs={"monthly_incomes_paise": str(monthly_incomes_paise), "monthly_expenses_paise": monthly_expenses_paise},
        formula=f"save {target_rate_pct}% of every payout; never less than {target_rate_pct}% of your leanest month",
        assumptions=["Past months are a fair guide to future months"],
        limitations=["In a month below the leanest month you have seen, the floor may not be possible; skip and resume"],
    )


def seasonal_plan(harvest_income_paise: int, months_until_next_harvest: int, monthly_expenses_paise: int,
                  next_season_input_cost_paise: int) -> Result:
    """Split harvest money into next-season inputs, household months and what is left (FR-STR-07)."""
    _require(harvest_income_paise > 0, "harvest income must be positive")
    _require(1 <= months_until_next_harvest <= 12, "months until next harvest must be 1 to 12")
    _require(monthly_expenses_paise >= 0 and next_season_input_cost_paise >= 0, "amounts cannot be negative")
    household = monthly_expenses_paise * months_until_next_harvest
    needed = household + next_season_input_cost_paise
    left = harvest_income_paise - needed
    monthly_allowance = harvest_income_paise - next_season_input_cost_paise
    return Result(
        figures={"set_aside_inputs_paise": next_season_input_cost_paise, "household_reserve_paise": household,
                 "total_needed_paise": needed, "left_over_paise": left, "covers_until_next_harvest": left >= 0,
                 "monthly_spend_possible_paise": max(monthly_allowance, 0) // months_until_next_harvest},
        inputs={"harvest_income_paise": harvest_income_paise, "months_until_next_harvest": months_until_next_harvest,
                "monthly_expenses_paise": monthly_expenses_paise, "next_season_input_cost_paise": next_season_input_cost_paise},
        formula="set aside next-season inputs first; household reserve = monthly expenses × months to next harvest",
        assumptions=["The next harvest arrives on time"],
        limitations=["Crop failure or price falls are not modelled; see crop insurance in Schemes"],
    )


def loan_cost(principal_paise: int, emi_paise: int, months: int, upfront_fees_paise: int = 0) -> Result:
    """Total cost and effective annual rate (APR) of an EMI loan, fees included, by bisection on the monthly IRR."""
    _require(principal_paise > 0 and emi_paise > 0 and months > 0, "principal, EMI and months must be positive")
    _require(0 <= upfront_fees_paise < principal_paise, "fees must be less than the principal")
    total = emi_paise * months
    received = principal_paise - upfront_fees_paise
    _require(total >= received, "EMIs repay less than you receive; check the numbers")

    def pv(r: Decimal) -> Decimal:
        if r == 0:
            return Decimal(emi_paise) * months
        return Decimal(emi_paise) * (1 - (1 + r) ** -months) / r

    lo, hi = Decimal(0), Decimal(1)  # monthly rate between 0 % and 100 %
    for _ in range(200):
        mid = (lo + hi) / 2
        if pv(mid) > received:
            lo = mid
        else:
            hi = mid
    monthly = (lo + hi) / 2
    apr = float(((1 + monthly) ** 12 - 1) * 100)
    nominal = float(monthly * 12 * 100)
    return Result(
        figures={"total_repaid_paise": total, "total_interest_and_fees_paise": total - received,
                 "effective_annual_rate_pct": round(apr, 1), "nominal_annual_rate_pct": round(nominal, 1),
                 "high_cost": apr > 36},
        inputs={"principal_paise": principal_paise, "emi_paise": emi_paise, "months": months, "upfront_fees_paise": upfront_fees_paise},
        formula="find the monthly rate r where the EMIs' present value equals the money you receive; APR = (1+r)^12 − 1",
        assumptions=["EMIs are paid on time, monthly"],
        limitations=["Late fees, penalties and insurance add-ons are not included unless entered as fees",
                     "'High cost' flags an effective rate above 36 % a year"],
    )


def sip_illustration(monthly_paise: int, months: int, assumed_annual_return_pct: float) -> Result:
    """Future value of a monthly investment at an ASSUMED constant return. An illustration, not a forecast."""
    _require(monthly_paise > 0 and months > 0, "amount and months must be positive")
    _require(0 <= assumed_annual_return_pct <= 20, "assumed return must be between 0 and 20 %")
    r = Decimal(str(assumed_annual_return_pct)) / 1200
    invested = monthly_paise * months
    fv = Decimal(invested) if r == 0 else Decimal(monthly_paise) * (((1 + r) ** months - 1) / r) * (1 + r)
    fv_i = int(fv.quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    return Result(
        figures={"invested_paise": invested, "illustrated_value_paise": fv_i, "illustrated_gain_paise": fv_i - invested},
        inputs={"monthly_paise": monthly_paise, "months": months, "assumed_annual_return_pct": assumed_annual_return_pct},
        formula="future value of monthly deposits at the start of each month, compounded monthly",
        assumptions=[f"A constant {assumed_annual_return_pct}% yearly return, which real markets do not give"],
        limitations=["Returns are not guaranteed and can be negative", "Costs and taxes are not included",
                     "Educational illustration, not a recommendation to buy any product"],
    )
