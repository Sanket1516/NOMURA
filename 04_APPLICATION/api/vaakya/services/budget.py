"""Financial items (budget entries) and the monthly budget summary."""
from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import date

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from .. import schemas as s
from ..core.errors import DomainValidationError
from ..core.money import money
from ..domain import calculators as calc
from ..models import FinancialItem, Profile
from .assessment import monthly_figures
from .common import emit, get_owned


def item_out(i: FinancialItem) -> s.ItemOut:
    return s.ItemOut(id=i.id, kind=i.kind, label=i.label, category=i.category, amount=money(i.amount_paise),  # type: ignore[arg-type]
                     frequency=i.frequency, on_date=i.on_date, source=i.source)


def list_items(db: Session, user_id: uuid.UUID, month: str | None, kind: str | None, limit: int) -> list[s.ItemOut]:
    q = select(FinancialItem).where(FinancialItem.user_id == user_id)
    if month:
        start, end = _month_range(month)
        q = q.where(or_(FinancialItem.frequency == "monthly", and_(FinancialItem.on_date >= start, FinancialItem.on_date < end)))
    if kind:
        q = q.where(FinancialItem.kind == kind)
    return [item_out(i) for i in db.scalars(q.order_by(FinancialItem.on_date.desc(), FinancialItem.created_at.desc()).limit(limit))]


def add_item(db: Session, user_id: uuid.UUID, body: s.ItemIn) -> s.ItemOut:
    if body.amount.paise <= 0:
        raise DomainValidationError("amount must be positive")
    i = FinancialItem(user_id=user_id, kind=body.kind, label=body.label, category=body.category, amount_paise=body.amount.paise,
                      frequency=body.frequency, on_date=body.on_date, source="typed")
    db.add(i)
    db.flush()
    emit(db, user_id, "FinancialItemAdded", {"kind": i.kind})
    return item_out(i)


def patch_item(db: Session, user_id: uuid.UUID, item_id: uuid.UUID, body: s.ItemPatch) -> s.ItemOut:
    i = get_owned(db, FinancialItem, item_id, user_id)
    if body.amount is not None:
        if body.amount.paise <= 0:
            raise DomainValidationError("amount must be positive")
        i.amount_paise = body.amount.paise
    for k in ("label", "category", "on_date"):
        v = getattr(body, k)
        if v is not None:
            setattr(i, k, v)
    db.flush()
    return item_out(i)


def delete_item(db: Session, user_id: uuid.UUID, item_id: uuid.UUID) -> None:
    db.delete(get_owned(db, FinancialItem, item_id, user_id))


def _month_range(month: str) -> tuple[date, date]:
    try:
        y, m = (int(x) for x in month.split("-"))
        start = date(y, m, 1)
    except (ValueError, TypeError) as e:
        raise DomainValidationError("month must be YYYY-MM") from e
    end = date(y + (m == 12), 1 if m == 12 else m + 1, 1)
    return start, end


def month_budget(db: Session, user_id: uuid.UUID, month: str) -> s.BudgetOut:
    start, end = _month_range(month)
    items = db.scalars(select(FinancialItem).where(FinancialItem.user_id == user_id, FinancialItem.kind.in_(["income", "expense", "saving", "loan"]),
                                                   or_(and_(FinancialItem.frequency == "monthly", FinancialItem.on_date < end),
                                                       and_(FinancialItem.on_date >= start, FinancialItem.on_date < end)))).all()
    totals: dict[str, int] = defaultdict(int)
    cats: dict[tuple[str, str], int] = defaultdict(int)
    for i in items:
        totals[i.kind] += i.amount_paise
        cats[(i.kind, i.category)] += i.amount_paise
    left = totals["income"] - totals["expense"] - totals["saving"] - totals["loan"]
    prof = db.get(Profile, user_id)
    rule = None
    f = monthly_figures(db, user_id)
    if prof and prof.income_type == "variable" and f["income_min"] > 0 and f["income_max"] >= f["income_min"]:
        rule = calc.irregular_income_rule([f["income_min"], f["income_max"]], f["expenses"]).as_dict()
    return s.BudgetOut(month=month, income=money(totals["income"]), expenses=money(totals["expense"]), saving=money(totals["saving"]),  # type: ignore[arg-type]
                       loan_payments=money(totals["loan"]), left=money(left),  # type: ignore[arg-type]
                       by_category=[{"kind": k, "category": c, "amount": money(v)} for (k, c), v in sorted(cats.items())], saving_rule=rule)
