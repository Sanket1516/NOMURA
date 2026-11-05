from vaakya.services.extraction import extract

SLIP = """ABC Public School, Thane
Salary Slip for October 2026
Basic Pay 28,000.00   DA 7,000.00
Gross Salary: Rs 41,500.00
Total Deductions: 6,500.00
Net Pay: ₹35,000.00
"""


def test_salary_slip_fields():
    f = {x["field"]: x for x in extract("salary_slip", SLIP)}
    assert f["net_monthly_income"]["value"]["display"] == "₹35,000"
    assert f["gross_monthly_income"]["value"]["paise"] == 4_150_000
    assert f["total_deductions"]["value"]["paise"] == 650_000
    assert f["pay_month"]["value"] == "October 2026" and f["net_monthly_income"]["confidence"] == 0.9


def test_net_above_gross_is_flagged_not_trusted():
    f = {x["field"]: x for x in extract("salary_slip", "Gross Pay 30,000\nNet Pay 35,000")}
    assert f["net_monthly_income"]["confidence"] == 0.4 and "warning" in f["net_monthly_income"]


def test_bank_statement_and_marathi_label():
    f = {x["field"]: x for x in extract("bank_statement", "Opening Balance 10,250.50\nNEFT SALARY CREDIT 35,000.00\nClosing Balance 52,300.00")}
    assert f["closing_balance"]["value"]["paise"] == 5_230_000 and f["salary_credit"]["value"]["paise"] == 3_500_000
    assert extract("salary_slip", "निव्वळ पगार: 25,000")[0]["value"]["paise"] == 2_500_000


def test_nothing_found_and_unknown_kind():
    assert extract("salary_slip", "Hello world") == []
    assert extract("land_record", SLIP) == []
