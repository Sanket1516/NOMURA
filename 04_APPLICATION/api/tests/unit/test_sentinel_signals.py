"""Labelled scam and genuine messages. Scam set: must be HIGH or CRITICAL. Genuine set: must be LOW or MEDIUM."""
import pytest

from vaakya.domain import sentinel_signals as ss

SCAMS = [
    "Dear customer your SBI KYC expires today. Update immediately at http://sbi-kyc-update.xyz/login or account will be blocked",
    "Your electricity connection will be disconnected tonight at 9.30 pm. Call officer 9876543210 immediately",
    "Congratulations! You have won Rs 25,00,000 in KBC lucky draw. Pay processing fee of ₹4,999 to claim",
    "Instant loan in 5 minutes without documents! No CIBIL check. Allow contacts permission to get ₹50,000",
    "Earn ₹3000 daily by liking YouTube videos. Part time job. Join our telegram group",
    "Guaranteed 3% daily returns on crypto trading. Join our WhatsApp group now, limited seats",
    "This is customs officer. Parcel in your name has drugs. You are under digital arrest. Pay to clear your name",
    "To receive your refund of ₹2,000 please enter your UPI PIN on the collect request",
    "Bank customer care here. Please share the OTP you just received to stop the fraud transaction",
    "Install AnyDesk app so our support team can verify your KYC",
    "Your PAN card will be deactivated. Update at https://incometax-refund.online/verify",
    "http://192.168.4.20/paytm/verify your wallet suspended",
]
GENUINE = [
    "Your OTP for login is 482913. Do not share it with anyone. -SBI",
    "Rs 35,000 credited to your account XX1234 on 01-11-2026. Avl bal Rs 52,300.",
    "Your electricity bill of ₹1,240 is due on 15 Nov. Pay on the official app.",
    "Reminder: your SIP of ₹1,000 will be debited on 5th.",
    "Meeting at school tomorrow at 10 am for parents.",
    "Visit https://www.onlinesbi.sbi for net banking.",
    "Your PMJJBY premium of ₹436 will be auto-debited on 31 May.",
]


@pytest.mark.parametrize("msg", SCAMS)
def test_scams_are_high_or_critical(msg):
    r = ss.analyse(msg)
    assert r["risk_level"] in ("high", "critical"), (msg, r["risk_indicator"], [f.signal for f in r["findings"]])


@pytest.mark.parametrize("msg", GENUINE)
def test_genuine_messages_are_low_or_medium(msg):
    r = ss.analyse(msg)
    assert r["risk_level"] in ("low", "medium"), (msg, [f.signal for f in r["findings"]])


def test_evidence_is_quoted_from_input():
    msg = SCAMS[0]
    for f in ss.analyse(msg)["findings"]:
        assert f.evidence in msg


def test_link_heuristics_never_fetch_and_flag_lookalikes():
    findings = {f.signal for f in ss.analyse_links("go to http://hdfc-netbanking.secure-login.top/a and bit.ly/x9")}
    assert {"link_lookalike", "link_risky_domain", "link_shortener", "link_no_https"} <= findings
    assert ss.analyse_links("https://www.hdfcbank.com/personal") == []
    assert {f.signal for f in ss.analyse_links("http://xn--sbi-xyz.com")} >= {"link_punycode"}


def test_levels_and_actions():
    assert ss.level_for(10, []) == "low" and ss.level_for(30, []) == "medium" and ss.level_for(55, []) == "high" and ss.level_for(80, []) == "critical"
    r = ss.analyse(SCAMS[8])
    acts = ss.actions_for(r["findings"], r["risk_level"])
    assert any("1930" in a for a in acts) and len(acts) <= 5
    assert "No known warning signs" in ss.actions_for([], "low")[0]


def test_detection_rates_summary():
    tp = sum(ss.analyse(m)["risk_level"] in ("high", "critical") for m in SCAMS)
    fp = sum(ss.analyse(m)["risk_level"] in ("high", "critical") for m in GENUINE)
    print(f"scam recall {tp}/{len(SCAMS)}, false alarms {fp}/{len(GENUINE)}")
    assert tp == len(SCAMS) and fp == 0
