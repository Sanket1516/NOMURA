"""Strategy Builder agent (FR-STR-02..09, -12): personalised plans from the user's own numbers.
All figures come from domain.calculators. Every answer lists its assumptions and limitations. Uses Financial Life Graph risks."""
from __future__ import annotations

import re

from ..core.money import format_inr
from ..domain import calculators as calc
from ..services.assessment import monthly_figures
from ..services.goals import list_goals
from .base import AgentContext, AgentOutput

AMOUNT = re.compile(r"(?:₹|rs\.?|inr)?\s?(\d[\d,]{2,})(?!\d)", re.IGNORECASE)
MONTHS = re.compile(r"(\d{1,3})\s*(months?|महीने|ತಿಂಗಳು)", re.IGNORECASE)
WEEKS = re.compile(r"(\d{1,3})\s*weeks?", re.IGNORECASE)


def _r(paise: int) -> str:
    return format_inr(round(paise / 100))


def _amounts(text: str) -> list[int]:
    return [int(a.replace(",", "")) * 100 for a in AMOUNT.findall(text)]


class StrategyBuilder:
    name = "strategy"

    def run(self, ctx: AgentContext) -> AgentOutput:
        q = str(ctx.question).lower()
        f = monthly_figures(ctx.db, ctx.user_id)
        income_type = ctx.profile.get("income_type", "salaried")
        if any(w in q for w in ("loan", "emi", "borrow", "interest", "repay")) or any(p.data.get("loan_offer") for p in ctx.prior):
            return self._loan(ctx, q)
        if f["income"] == 0:
            return AgentOutput(agent="strategy", text="To build a plan from your real numbers, I need your income and spending first. "
                               "Please finish the money questions in your profile (about two minutes).", data={"needs": ["assessment"]})
        if income_type == "seasonal" or any(w in q for w in ("harvest", "season", "crop")):
            return self._seasonal(ctx, f)
        if income_type == "variable" or any(w in q for w in ("irregular", "changes every month", "varies", "gig")):
            return self._irregular(ctx, f)
        return self._emergency_and_goals(ctx, f)

    def _common_tail(self, r: calc.Result) -> str:
        return ("\n\nAssumptions: " + "; ".join(r.assumptions) + ".\nLimits: " + "; ".join(r.limitations) + ".")

    def _emergency_and_goals(self, ctx: AgentContext, f: dict) -> AgentOutput:
        ef = calc.emergency_fund_target(max(f["expenses"], 1), ctx.profile.get("income_type", "salaried"))
        target, months = ef.figures["target_paise"], ef.figures["months_of_expenses"]
        reserve = f["savings"]
        goals = list_goals(ctx.db, ctx.user_id)
        surplus = f["income"] - f["expenses"] - f["emi"]
        lines = [f"Your emergency fund target is {_r(target)}: {months} months of your {_r(f['expenses'])} monthly spending.",
                 f"You have about {_r(reserve)} you can reach quickly."]
        figures = {"target": _r(target), "expenses": _r(f["expenses"]), "reserve": _r(reserve), "months": months, "surplus": _r(surplus)}
        if surplus > 0:
            lines.append(f"After spending and EMIs, about {_r(surplus)} is left each month.")
        if goals:
            g = goals[0]
            lines.append(f"Your first goal, “{g.title}”, needs {g.monthly_plan.display} a month and is "
                         f"{'on track' if g.on_track else 'behind plan'} at {g.progress_pct}% saved.")
            figures |= {"goal_monthly": g.monthly_plan.display, "goal_pct": g.progress_pct}
        risks = [r.get("kind") for r in ctx.twin.get("risks", [])] if ctx.twin else []
        steps = ["Move a fixed amount to savings on payday, before spending."]
        if "uninsured_dependants" in risks:
            steps.append("You have dependants and no insurance recorded: ask the Connector about PMJJBY and PMSBY.")
        if "high_emi" in risks:
            steps.append("Your EMIs take a large share of income: avoid new loans until the emergency fund is started.")
        text = " ".join(lines) + "\n\nNext steps:\n- " + "\n- ".join(steps) + self._common_tail(ef)
        return AgentOutput(agent="strategy", text=text, figures=figures, data={"emergency_fund": ef.as_dict()})

    def _irregular(self, ctx: AgentContext, f: dict) -> AgentOutput:
        r = calc.irregular_income_rule([f["income_min"], f["income_max"]], f["expenses"])
        x = r.figures
        text = (f"Because your income changes, save a percentage instead of a fixed amount: {x['save_rate_pct']}% of every payout. "
                f"In a lean month ({_r(x['lean_month_paise'])}) that is at least {_r(x['monthly_floor_paise'])}; in a good month "
                f"({_r(x['good_month_paise'])}) it is {_r(x['save_in_good_month_paise'])}. Keep the floor even in bad months, then top up in good ones."
                "\n\nNext steps:\n- Set the percentage as an automatic transfer from each payout if your bank allows it.\n- Build six months of "
                "expenses first, because irregular income needs a bigger cushion." + self._common_tail(r))
        figures = {k: (_r(v) if k.endswith("paise") else v) for k, v in x.items()}
        return AgentOutput(agent="strategy", text=text, figures=figures, data={"irregular_income": r.as_dict()})

    def _seasonal(self, ctx: AgentContext, f: dict) -> AgentOutput:
        amounts = _amounts(str(ctx.question))
        m = MONTHS.search(str(ctx.question))
        harvest = amounts[0] if amounts else f["income_max"] * 6
        months = int(m.group(1)) if m and 1 <= int(m.group(1)) <= 12 else 6
        inputs = amounts[1] if len(amounts) > 1 else 0
        r = calc.seasonal_plan(harvest, months, max(f["expenses"], 0), inputs)
        x = r.figures
        text = (f"From a harvest of {_r(harvest)}: first set aside {_r(x['set_aside_inputs_paise'])} for next season's inputs, then "
                f"{_r(x['household_reserve_paise'])} for {months} months of household spending. "
                + (f"That leaves {_r(x['left_over_paise'])} for savings or debts." if x["covers_until_next_harvest"]
                   else f"The harvest is {_r(-x['left_over_paise'])} short of covering everything until the next one: cut costs now or plan "
                        "for a small crop loan only from a bank or KCC.")
                + "\n\nNext steps:\n- Keep the season money in a separate account.\n- Ask the Connector about crop insurance (PMFBY)."
                + self._common_tail(r))
        figures = {k: (_r(v) if isinstance(v, int) and k.endswith("paise") else v) for k, v in x.items()} | {"harvest": _r(harvest), "months": months}
        return AgentOutput(agent="strategy", text=text, figures=figures, data={"seasonal": r.as_dict()}, handoff=None)

    def _loan(self, ctx: AgentContext, q: str) -> AgentOutput:
        amounts = _amounts(str(ctx.question))
        months_m, weeks_m = MONTHS.search(q), WEEKS.search(q)
        months = int(months_m.group(1)) if months_m else (max(1, round(int(weeks_m.group(1)) / 4.345)) if weeks_m else 0)
        if len(amounts) >= 2 and months:
            principal, emi = amounts[0], amounts[1]
            fees = amounts[2] if len(amounts) > 2 else 0
            if weeks_m and not months_m:  # weekly instalments → monthly equivalent
                emi = round(emi * 4.345)
            try:
                r = calc.loan_cost(principal, emi, months, fees)
            except ValueError as e:
                return AgentOutput(agent="strategy", text=f"Those loan numbers do not add up ({e}). Check the amount, EMI and months.")
            x = r.figures
            verdict = ("This is a very expensive loan." if x["high_cost"] else "This rate is within the usual range for personal loans, but compare it with your bank.")
            text = (f"You would repay {_r(x['total_repaid_paise'])} in total, of which {_r(x['total_interest_and_fees_paise'])} is interest and fees. "
                    f"The effective yearly rate is about {x['effective_annual_rate_pct']}%. {verdict}"
                    "\n\nSafer options:\n- Ask your bank or a cooperative society for a small personal or gold loan.\n- If you have a KCC, use it for farm needs."
                    "\n- Use your emergency fund first, then rebuild it." + self._common_tail(r))
            figures = {"total": _r(x["total_repaid_paise"]), "cost": _r(x["total_interest_and_fees_paise"]), "apr": x["effective_annual_rate_pct"],
                       "nominal": x["nominal_annual_rate_pct"]}
            return AgentOutput(agent="strategy", text=text, figures=figures, data={"loan_cost": r.as_dict()},
                               events=[("LoanCostChecked", {"high_cost": x["high_cost"], "agent": "strategy"})])
        return AgentOutput(agent="strategy", text=("To check a loan's real cost I need three numbers: how much you receive, the instalment, and for how many "
                                                   "months or weeks. For example: “₹10,000 loan, ₹1,200 a week for 10 weeks, ₹1,500 fee”."
                                                   "\n\nUntil then: borrow only from banks and RBI-regulated lenders, and never from an app that asks for your contacts."),
                           data={"needs": ["principal", "instalment", "duration"], "example": "₹10,000 loan, ₹1,200 a week for 10 weeks, ₹1,500 fee"})
