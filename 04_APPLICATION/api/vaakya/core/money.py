"""Money is integer paise in storage and Decimal in arithmetic. Never float (SYSTEM_ARCHITECTURE §7)."""
from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
         "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def _lt100(n: int) -> str:
    return _ONES[n] if n < 20 else " ".join(x for x in (_TENS[n // 10], _ONES[n % 10]) if x)


def _lt1000(n: int) -> str:
    return " ".join(x for x in ((f"{_ONES[n // 100]} hundred" if n // 100 else ""), (_lt100(n % 100) if n % 100 else "")) if x)


def format_inr(rupees: int) -> str:
    """₹1,56,000: Indian digit grouping."""
    neg, n = rupees < 0, abs(int(rupees))
    s = str(n)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        s = ",".join(groups) + "," + tail
    return f"{'-' if neg else ''}₹{s}"


def spoken_inr(rupees: int) -> str:
    n = abs(int(rupees))
    if n == 0:
        return "zero rupees"
    crore, n = divmod(n, 10**7)
    lakh, n = divmod(n, 10**5)
    thousand, n = divmod(n, 1000)
    parts = [f"{_lt1000(crore)} crore" if crore else "", f"{_lt100(lakh)} lakh" if lakh else "",
             f"{_lt100(thousand)} thousand" if thousand else "", _lt1000(n) if n else ""]
    return ("minus " if rupees < 0 else "") + " ".join(p for p in parts if p) + " rupees"


def rupees_from_paise(paise: int) -> Decimal:
    return (Decimal(paise) / 100).quantize(Decimal("0.01"))


def money(paise: int) -> dict:
    """API Money object (API_DESIGN shared schema). Display rounds to whole rupees."""
    r = int((Decimal(paise) / 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    return {"paise": int(paise), "display": format_inr(r), "spoken": spoken_inr(r)}
