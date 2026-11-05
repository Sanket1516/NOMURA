"""Sentinel signal engine (FR-SEN-02, -04, -05, -08, -09, -12). Deterministic, versioned, explainable.

Every signal has a severity, a weight, a plain explanation and an action. Evidence is always an exact quote from the input.
Links are analysed as TEXT: they are never fetched, opened or resolved (safety rule).
The number returned is a weighted RISK INDICATOR, not a calibrated probability (MASTER_PLAN §11) until T6.05 calibrates it.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from urllib.parse import urlsplit

WEIGHTS_VERSION = "sig-1"


@dataclass(frozen=True)
class Signal:
    id: str
    severity: str  # low | medium | high | critical
    weight: int
    patterns: tuple[str, ...]
    explanation: str
    action: str


SIGNALS: tuple[Signal, ...] = (
    Signal("otp_request", "critical", 60, (r"\b(share|send|tell|give|forward)\b.{0,30}\b(otp|one[- ]time password|pin|cvv|password)\b",
                                          r"\b(otp|pin|cvv)\b.{0,30}\b(share|send|tell|give)\b", r"ओटीपी.{0,20}(बताएं|भेजें|शेयर)"),
           "It asks for an OTP, PIN, CVV or password. Banks and government offices never ask for these.", "Do not share any OTP, PIN or password."),
    Signal("pin_to_receive", "critical", 60, (r"(enter|put).{0,20}(upi )?pin.{0,30}(receive|get|credit|refund)", r"scan.{0,20}(qr|code).{0,30}(receive|get|refund)",
                                             r"(receive|get|claim).{0,40}(refund|money|amount|cashback).{0,60}(enter|put|type).{0,20}(upi )?pin"),
           "It says you must enter a PIN or scan a code to receive money. Entering a PIN always sends money.", "Never enter your UPI PIN to receive money."),
    Signal("remote_access", "critical", 55, (r"anydesk|teamviewer|quick ?support|rustdesk|screen ?shar", r"install.{0,20}(app|apk).{0,30}(support|verify|kyc)"),
           "It asks you to install a screen-sharing or support app, which lets a stranger control your phone.", "Do not install apps someone asks you to install."),
    Signal("account_block_threat", "high", 30, (r"(account|kyc|sim|wallet|card|pan|electricity|connection).{0,40}(block|suspend|deactivat|disconnect|expire|close)",
                                                r"(बंद|ब्लॉक).{0,15}(हो जाएगा|होगा)"),
           "It threatens that your account, SIM or service will be blocked unless you act.", "Check only in the official app or by calling the number on your card or bill."),
    Signal("urgency", "medium", 15, (r"\b(urgent|immediately|today only|within \d+ (hours?|minutes?)|last chance|act now|tonight|expires? today)\b", r"तुरंत|आज ही"),
           "It pushes you to act fast, so you do not stop to check.", "Pause. Real organisations give you time."),
    Signal("guaranteed_returns", "high", 35, (r"guarantee\w*.{0,30}(return|profit|income)", r"double (your )?money", r"risk[- ]free"),
           "It promises fixed or guaranteed returns. Real investments cannot guarantee returns.", "Check that any advisor is registered with SEBI before investing."),
    Signal("unrealistic_returns", "critical", 50, (r"\b\d+(\.\d+)?\s?%\s?(daily|per day|a day|weekly|per week)\b(?!.{0,10}(late|penalty))",),
           "It promises a return every day or week. No genuine investment pays like that.", "Do not invest. Report the group or app."),
    Signal("prize_fee", "high", 35, (r"(won|winner|lottery|prize|lucky draw|kbc|gift).{0,60}(fee|tax|charge|pay|deposit|processing)",
                                     r"(congratulations|you have won|you won)"),
           "It says you won a prize, often asking for a fee to claim it. Real prizes do not ask winners to pay.", "Do not pay to claim a prize."),
    Signal("upfront_payment", "high", 30, (r"(pay|deposit|transfer).{0,40}(processing|registration|activation|security|insurance) (fee|charge|amount)",
                                           r"(fee|charge) of ₹?\s?\d"),
           "It asks for money upfront before you get a loan, job or prize.", "Do not pay upfront fees to strangers."),
    Signal("instant_loan", "high", 30, (r"(instant|quick|5 minutes?|10 minutes?|without documents|no documents|no cibil|no credit check).{0,40}loan",
                                        r"loan.{0,40}(instant|in minutes|without documents|no cibil|pre-?approved)"),
           "It offers an instant loan with no checks, a common sign of unregulated loan apps.", "Borrow only from banks and RBI-regulated lenders; check the lender's name."),
    Signal("contacts_permission", "high", 35, (r"(access|permission|allow).{0,30}(contacts?|gallery|photos?)", r"(contacts?|gallery).{0,20}(access|permission)"),
           "It wants access to your contacts or photos. Illegal loan apps use this for harassment.", "Deny contact and photo access; uninstall the app."),
    Signal("task_job", "high", 40, (r"(part[- ]time|work from home).{0,40}(job|earn|income)", r"(like|rate|review).{0,30}(videos?|hotels?|products?).{0,30}(earn|pay|₹)",
                                      r"earn ₹?\s?\d[\d,]* (daily|per day|a day)"),
           "It offers easy money for simple online tasks; these turn into deposit scams.", "Never deposit money to unlock tasks or earnings."),
    Signal("impersonation", "medium", 20, (r"\b(rbi|sebi|income tax|police|cbi|customs|courier|trai|uidai|npci|bank manager|customer care)\b.{0,40}(officer|department|calling|notice|case|verify)",
                                           r"digital arrest"),
           "It claims to be a bank, regulator or police. Scammers often pretend to be officials.", "Call the organisation yourself on its official number."),
    Signal("threat_legal", "high", 30, (r"(arrest|fir|legal action|court|warrant|money laundering|drugs?).{0,40}(you|your|against)", r"digital arrest"),
           "It threatens arrest or legal action to scare you into paying.", "Police do not settle cases by video call or ask for payments."),
    Signal("call_personal_number", "medium", 25, (r"(call|contact|whatsapp|message).{0,30}(officer|executive|agent|manager|helpline)?.{0,20}(\+91[ -]?)?[6-9]\d{9}\b",),
           "It asks you to call a personal mobile number instead of an official helpline.", "Use only the number on the official website, bill or card."),
    Signal("messaging_channel", "low", 10, (r"\b(telegram|whatsapp group|join (our|the) group)\b",),
           "It moves the conversation to Telegram or a WhatsApp group, which is common in investment and task scams.", "Be careful with groups that promise money."),
)
_COMPILED = [(s, [re.compile(p, re.IGNORECASE) for p in s.patterns]) for s in SIGNALS]

BRANDS = {"sbi": ("sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"), "hdfc": ("hdfcbank.com",), "icici": ("icicibank.com",), "axis": ("axisbank.com",),
          "paytm": ("paytm.com",), "phonepe": ("phonepe.com",), "rbi": ("rbi.org.in",), "npci": ("npci.org.in",), "uidai": ("uidai.gov.in",),
          "incometax": ("incometax.gov.in",), "epfo": ("epfindia.gov.in",), "pmkisan": ("pmkisan.gov.in",), "sebi": ("sebi.gov.in",), "kotak": ("kotak.com",)}
SHORTENERS = {"bit.ly", "tinyurl.com", "t.ly", "cutt.ly", "is.gd", "rb.gy", "shorturl.at", "t.co", "goo.gl", "ow.ly", "tiny.cc"}
RISKY_TLDS = {"xyz", "top", "click", "online", "site", "live", "icu", "buzz", "rest", "work", "loan", "win", "tk", "ml", "ga", "cf", "gq"}
URL_RE = re.compile(r"(?i)\b((?:https?://|www\.)[^\s<>\"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|co|net|org|xyz|top|click|online|site|live|icu|buzz|info|link|app|tk|ml|ga|cf|gq|sbi|ly|gd|at|to|me|cc|ru|cn|gov\.in)(?:/[^\s<>\"']*)?)")


@dataclass
class Finding:
    signal: str
    severity: str
    weight: int
    evidence: str
    explanation: str
    action: str


def analyse_links(text: str) -> list[Finding]:
    """Textual URL heuristics. Never makes a network request."""
    out: list[Finding] = []
    for raw in URL_RE.findall(text):
        url = raw if raw.lower().startswith("http") else f"http://{raw}"
        try:
            parts = urlsplit(url)
        except ValueError:
            continue
        host = (parts.hostname or "").lower().rstrip(".")
        if not host:
            continue
        labels = host.split(".")
        reg = ".".join(labels[-3:]) if host.endswith((".gov.in", ".co.in", ".org.in", ".nic.in")) else ".".join(labels[-2:])

        def add(sig, sev, w, expl, act="Do not open the link. Go to the official app or website yourself."):
            out.append(Finding(sig, sev, w, raw, expl, act))
        if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host):
            add("link_ip_address", "high", 30, "The link goes to a bare IP address, not a named website.")
        if host in SHORTENERS:
            add("link_shortener", "medium", 20, "The link is shortened, which hides where it really goes.")
        if "xn--" in host:
            add("link_punycode", "high", 30, "The web address uses look-alike characters to imitate a real site.")
        if labels[-1] in RISKY_TLDS:
            add("link_risky_domain", "medium", 20, f"The website ends in '.{labels[-1]}', a domain type often used in scams.")
        if "@" in parts.netloc:
            add("link_userinfo", "high", 30, "The link hides its real destination after an '@' sign.")
        for brand, officials in BRANDS.items():
            if brand in host.replace("-", "") and not any(host == o or host.endswith("." + o) for o in officials):
                add("link_lookalike", "critical", 50, f"The link mentions '{brand.upper()}' but is not an official site ({', '.join(officials)}).")
                break
        if parts.scheme == "http" and raw.lower().startswith("http://"):
            add("link_no_https", "low", 10, "The link is not secure (http, not https).")
        if len(labels) >= 5:
            add("link_many_subdomains", "medium", 15, "The web address has many parts, a trick to look official.")
        _ = reg
    return out


NEGATED = {"otp_request", "pin_to_receive", "remote_access"}
_NEG = re.compile(r"(?i)\b(do not|don'?t|never|not to|मत|नका|ಬೇಡ)\b")


def _negated(text: str, m: re.Match) -> bool:
    """'Do not share your OTP' is a warning, not a request."""
    window = text[max(0, m.start() - 40): m.end()]
    return bool(_NEG.search(window))


def analyse(text: str) -> dict:
    text = unicodedata.normalize("NFKC", text)
    findings: list[Finding] = []
    for sig, pats in _COMPILED:
        for p in pats:
            m = p.search(text)
            if m and sig.id in NEGATED and _negated(text, m):
                continue
            if m:
                findings.append(Finding(sig.id, sig.severity, sig.weight, m.group(0)[:160], sig.explanation, sig.action))
                break
    findings += analyse_links(text)
    seen, uniq = set(), []
    for f in findings:
        if (f.signal, f.evidence) not in seen:
            seen.add((f.signal, f.evidence))
            uniq.append(f)
    indicator = min(100, sum(f.weight for f in uniq))
    level = level_for(indicator, uniq)
    return {"risk_indicator": indicator, "risk_level": level, "findings": uniq, "weights_version": WEIGHTS_VERSION}


def level_for(indicator: int, findings: list[Finding]) -> str:
    """LOW < 25, MEDIUM 25-49, HIGH 50-74, CRITICAL ≥ 75 or any critical signal with corroboration."""
    critical = any(f.severity == "critical" for f in findings)
    if indicator >= 75 or (critical and indicator >= 60):
        return "critical"
    if indicator >= 50 or critical:
        return "high"
    if indicator >= 25:
        return "medium"
    return "low"


def actions_for(findings: list[Finding], level: str) -> list[str]:
    acts = []
    for f in sorted(findings, key=lambda f: -f.weight):
        if f.action not in acts:
            acts.append(f.action)
    if level in ("high", "critical"):
        acts.append("If you already paid or shared details, call 1930 and report at cybercrime.gov.in, and call your bank's official number.")
    if not findings:
        acts.append("No known warning signs found. If it asks for money, an OTP or a PIN, stop and check first.")
    return acts[:5]
