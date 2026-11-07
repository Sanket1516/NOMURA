import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy.orm import Session

from .. import schemas as s
from ..auth import User_
from ..db import get_db
from ..domain import calculators as calc
from ..ratelimit import limit
from ..services import budget, goals
from ..services.common import emit, today_ist

router = APIRouter(prefix="/v1", tags=["finance", "goals", "planning"])
DB = Annotated[Session, Depends(get_db, scope="function")]


@router.get("/financial-items", response_model=list[s.ItemOut])
def list_items(user: User_, db: DB, month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
               kind: s.ItemKind | None = None, limit_: int = Query(100, alias="limit", ge=1, le=500)):
    return budget.list_items(db, user.id, month, kind, limit_)


@router.post("/financial-items", response_model=s.ItemOut, status_code=201, dependencies=[limit("write")])
def add_item(body: s.ItemIn, user: User_, db: DB):
    return budget.add_item(db, user.id, body)


@router.patch("/financial-items/{item_id}", response_model=s.ItemOut, dependencies=[limit("write")])
def patch_item(item_id: uuid.UUID, body: s.ItemPatch, user: User_, db: DB):
    return budget.patch_item(db, user.id, item_id, body)


@router.delete("/financial-items/{item_id}", status_code=204)
def delete_item(item_id: uuid.UUID, user: User_, db: DB) -> None:
    budget.delete_item(db, user.id, item_id)


@router.get("/budget", response_model=s.BudgetOut, summary="Monthly budget: income, spending, saving, EMIs, left over")
def get_budget(user: User_, db: DB, month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$")):
    return budget.month_budget(db, user.id, month or today_ist().strftime("%Y-%m"))


@router.get("/goals", response_model=list[s.GoalOut])
def list_goals(user: User_, db: DB):
    return goals.list_goals(db, user.id)


@router.post("/goals", response_model=s.GoalOut, status_code=201, dependencies=[limit("write")])
def create_goal(body: s.GoalIn, user: User_, db: DB, response: Response,
                idempotency_key: Annotated[str | None, Header(max_length=64)] = None):
    g, created = goals.create_goal(db, user.id, body, idempotency_key)
    if not created:
        response.status_code = 200
    return g


@router.get("/goals/{goal_id}", response_model=s.GoalOut)
def get_goal(goal_id: uuid.UUID, user: User_, db: DB):
    from ..models import Goal
    from ..services.common import get_owned
    return goals.goal_out(db, get_owned(db, Goal, goal_id, user.id))


@router.patch("/goals/{goal_id}", response_model=s.GoalOut, dependencies=[limit("write")])
def patch_goal(goal_id: uuid.UUID, body: s.GoalPatch, user: User_, db: DB):
    return goals.update_goal(db, user.id, goal_id, body)


@router.delete("/goals/{goal_id}", status_code=204)
def delete_goal(goal_id: uuid.UUID, user: User_, db: DB) -> None:
    goals.delete_goal(db, user.id, goal_id)


@router.get("/goals/{goal_id}/plan", response_model=s.PlanOut, summary="Latest plan with every input and formula (Why this?)")
def get_plan(goal_id: uuid.UUID, user: User_, db: DB):
    return goals.get_plan(db, user.id, goal_id)


@router.post("/goals/{goal_id}/plan", response_model=s.PlanOut, dependencies=[limit("write")])
def rebuild_plan(goal_id: uuid.UUID, user: User_, db: DB):
    return goals.build_plan(db, user.id, goal_id)


@router.post("/goals/{goal_id}/contributions", response_model=s.GoalOut, dependencies=[limit("write")])
def contribute(goal_id: uuid.UUID, body: s.ContributionIn, user: User_, db: DB):
    return goals.contribute(db, user.id, goal_id, body)


def _calc(fn, *a, **k) -> dict:
    from ..core.errors import DomainValidationError
    try:
        return fn(*a, **k).as_dict()
    except ValueError as e:
        raise DomainValidationError(str(e)) from e


@router.post("/planning/emergency-fund", response_model=s.CalcOut)
def emergency_fund(body: s.EmergencyFundIn, user: User_):
    return _calc(calc.emergency_fund_target, body.monthly_expenses.paise, body.income_type)


@router.post("/planning/irregular-income", response_model=s.CalcOut)
def irregular(body: s.IrregularIn, user: User_):
    return _calc(calc.irregular_income_rule, [m.paise for m in body.monthly_incomes], body.monthly_expenses.paise, body.rate_pct)


@router.post("/planning/seasonal", response_model=s.CalcOut)
def seasonal(body: s.SeasonalIn, user: User_):
    return _calc(calc.seasonal_plan, body.harvest_income.paise, body.months_until_next_harvest, body.monthly_expenses.paise,
                 body.next_season_input_cost.paise)


@router.post("/planning/loan-cost", response_model=s.CalcOut)
def loan_cost(body: s.LoanIn, user: User_, db: DB):
    out = _calc(calc.loan_cost, body.principal.paise, body.emi.paise, body.months, body.upfront_fees.paise if body.upfront_fees else 0)
    emit(db, user.id, "LoanCostChecked", {"high_cost": out["figures"]["high_cost"], "agent": "strategy"}, project=False)
    return out


@router.post("/planning/sip-illustration", response_model=s.CalcOut)
def sip(body: s.SipIn, user: User_):
    return _calc(calc.sip_illustration, body.monthly.paise, body.months, body.assumed_annual_return_pct)
