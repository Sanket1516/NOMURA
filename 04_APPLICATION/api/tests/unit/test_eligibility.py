import json
from datetime import date
from pathlib import Path
from types import SimpleNamespace

import pytest

from vaakya.domain.eligibility import evaluate, facts_from_profile

SCHEMES = {s["id"]: s for s in json.loads((Path(__file__).parents[2] / "vaakya/data/schemes.json").read_text(encoding="utf-8"))["schemes"]}
KISAN = {"owns_farmland": True, "is_cultivator": True, "income_tax_payer": False, "institutional_landholder": False,
         "constitutional_post_holder": False, "govt_employee_excluded": False, "pensioner_10k_plus": False, "practising_professional": False,
         "has_bank_account": True, "age": 45}


def test_pm_kisan_full_facts_likely_eligible_and_any_exclusion_fails():
    assert evaluate(SCHEMES["pm-kisan"], KISAN)["status"] == "likely_eligible"
    for exclusion in ["income_tax_payer", "institutional_landholder", "practising_professional", "pensioner_10k_plus"]:
        r = evaluate(SCHEMES["pm-kisan"], {**KISAN, exclusion: True})
        assert r["status"] == "not_eligible", exclusion
        assert [c["id"] for c in r["criteria"] if c["result"] == "not_met"]


def test_missing_facts_are_unknown_with_a_question_never_guessed():
    r = evaluate(SCHEMES["pmfby"], {"is_cultivator": True})
    assert r["status"] == "needs_info"
    unknown = [c for c in r["criteria"] if c["result"] == "unknown"]
    assert unknown[0]["id"] == "notified" and "notified" in unknown[0]["ask"]


@pytest.mark.parametrize("age,expected", [(17, "not_eligible"), (18, "likely_eligible"), (50, "likely_eligible"), (51, "not_eligible")])
def test_pmjjby_age_boundaries(age, expected):
    assert evaluate(SCHEMES["pmjjby"], {"age": age, "has_bank_account": True})["status"] == expected


@pytest.mark.parametrize("age,expected", [(18, "likely_eligible"), (70, "likely_eligible"), (71, "not_eligible")])
def test_pmsby_age_boundaries(age, expected):
    assert evaluate(SCHEMES["pmsby"], {"age": age, "has_bank_account": True})["status"] == expected


def test_apy_excludes_taxpayers_and_over_40():
    base = {"age": 30, "has_bank_account": True, "income_tax_payer": False}
    assert evaluate(SCHEMES["apy"], base)["status"] == "likely_eligible"
    assert evaluate(SCHEMES["apy"], {**base, "income_tax_payer": True})["status"] == "not_eligible"
    assert evaluate(SCHEMES["apy"], {**base, "age": 41})["status"] == "not_eligible"


def test_kcc_accepts_allied_farming_through_or_field():
    assert evaluate(SCHEMES["kcc"], {"allied_farming": True, "has_bank_account": True})["status"] == "likely_eligible"
    assert evaluate(SCHEMES["kcc"], {"is_cultivator": False, "allied_farming": False, "has_bank_account": True})["status"] == "not_eligible"


def test_igndps_needs_80_percent():
    base = {"age": 30, "bpl_household": True}
    assert evaluate(SCHEMES["igndps"], {**base, "disability_percent": 79})["status"] == "not_eligible"
    assert evaluate(SCHEMES["igndps"], {**base, "disability_percent": 80})["status"] == "likely_eligible"


def test_facts_from_profile():
    p = SimpleNamespace(attributes={"has_bank_account": True}, birth_year=1998, disability="visual")
    f = facts_from_profile(p, date(2026, 11, 5))
    assert f == {"has_bank_account": True, "age": 28, "has_disability": True}
    assert evaluate(SCHEMES["udid"], f)["status"] == "likely_eligible"


def test_or_field_with_one_side_unknown_is_unknown():
    r = evaluate(SCHEMES["kcc"], {"is_cultivator": False, "has_bank_account": True})
    assert r["status"] == "needs_info" and r["criteria"][0]["result"] == "unknown"
