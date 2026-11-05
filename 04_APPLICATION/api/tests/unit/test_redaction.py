from vaakya.ai.llm import RedactedText
from vaakya.ai.redaction import luhn_ok, redact, verhoeff_ok

VALID_AADHAAR = "2341 2341 2346"  # passes Verhoeff


def test_checksums():
    assert verhoeff_ok(VALID_AADHAAR.replace(" ", "")) and not verhoeff_ok("234123412345")
    assert luhn_ok("4111111111111111") and not luhn_ok("4111111111111112")


def test_redacts_indian_identifiers_and_restores():
    text = (f"I am Priya, Aadhaar {VALID_AADHAAR}, PAN ABCPD1234E, call +91 98765 43210 or mail priya.d@example.com. "
            "UPI priya@okaxis, IFSC SBIN0001234, card 4111 1111 1111 1111, account no. 123456789012, my OTP is 482913.")
    r = redact(text, known_names=["Priya"])
    for secret in ["Priya", "2341 2341 2346", "ABCPD1234E", "98765 43210", "priya.d@example.com", "priya@okaxis", "SBIN0001234",
                   "4111 1111 1111 1111", "123456789012", "482913"]:
        assert secret not in r.text, secret
    assert isinstance(r.text, RedactedText)
    assert r.categories == ["AADHAAR", "ACCOUNT", "CARD", "EMAIL", "IFSC", "OTP", "PAN", "PERSON", "PHONE", "UPI"]
    assert r.restore(r.text) == text


def test_does_not_redact_ordinary_numbers():
    text = "I earn ₹35,000 a month, rent is 11000, I want ₹1,56,000 by 2028 and saved 12 percent. Number 234123412345 is not Aadhaar."
    r = redact(text)
    assert r.text == text and r.mapping == {}


def test_same_value_gets_same_token():
    r = redact("Call 9876543210. Again: 9876543210. Other: 9123456780")
    assert r.text.count("<PHONE_1>") == 2 and "<PHONE_2>" in r.text


def test_devanagari_and_kannada_text_keeps_language():
    r = redact("मेरा नंबर 9876543210 है और खाता 123456789012")
    assert "मेरा नंबर <PHONE_1> है" in r.text and "<ACCOUNT_1>" in r.text
