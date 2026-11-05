# Known Issues

**Last updated:** 2026-11-05 (after the quality and security audit; see `05_TESTING/audit/`). Severity: CRITICAL, HIGH, MEDIUM, LOW. No CRITICAL issue is known.

| # | Severity | Issue | Impact | Status / next step |
|---|---|---|---|---|
| KI-01 | HIGH | No LLM, speech-to-text, translation or embedding model has run | Agents answer from rules and templates (`llm_used: false`); answers are English; speech input unavailable; retrieval is lexical | BLOCKED on owner tasks T0.03, T0.07 to T0.10 (RTX 3050) |
| KI-02 | HIGH | Scheme facts (10 schemes) are unverified drafts | A user could rely on wrong eligibility or amounts | Human verification against official sources (T0.12). Do not launch before |
| KI-03 | HIGH | Legal position unreviewed | No DPDP or SEBI advice; the product must not claim compliance | T0.14 |
| KI-04 | MEDIUM | Lessons (6) and scam patterns are unreviewed drafts | Possible content errors | Reviewer (FR-EDU-07) |
| KI-05 | HIGH | Sentinel accuracy measured only on the set the rules were tuned on | Real-world false negatives and false alarms unknown | Independent labelled set (T6.05) **Second set written 2026-11-05 (not independent): recall 10/28, false alarms 0/24, versus 12/12 on the tuned set. Rules not yet improved. See `05_TESTING/data/SCAM_SET_2_RESULTS.md`.** |
| KI-06 | MEDIUM | Translations (hi, mr, kn) are unreviewed drafts. They cover all interface text; text from the API (scheme names and criteria, lessons, quizzes, agent answers, score explanations) is English | Wording may be wrong or unnatural; mixed-language pages | Native-speaker review; translation model (T0.09) for API text |
| KI-18 | HIGH | The consent wording is translated as a draft, but the stored consent version `2026-11` refers to the English text | A translated consent that nobody has legally reviewed may not satisfy DPDP notice duties | Legal review of consent text in all languages (T0.14); record the language shown with each consent **Partly done 2026-11-05: the language shown is now stored with each consent (migration 0004, tested on PostgreSQL incl. RLS; older rows stay NULL). The legal review of the wording is still open.** |
| KI-19 | LOW | The interface language is a cookie set by the language picker; the profile's preferred language is a separate field and does not set it | A user can see the interface in one language and get answers set for another | Set the cookie from the profile on first sign-in **Code written 2026-11-05, not yet verified on the live stack: sign-in callback sets `vaakya_lang` from the profile when no cookie exists; unit-tested, not tried through real Keycloak** |
| KI-20 | LOW | Low-literacy mode only enlarges icons and spacing (FR-LNG-04 is still planned); its description was claiming more and was corrected | Feature is thinner than the name suggests | Build shorter copy and fewer numbers per screen |
| KI-07 | MEDIUM | CSP allows `'unsafe-inline'` scripts and styles | Weaker XSS defence in depth | Nonce-based CSP |
| KI-08 | MEDIUM | No screen-reader, real-device or non-Chromium testing | Accessibility and compatibility claims limited to automated checks | Test with TalkBack, NVDA, VoiceOver; Firefox and WebKit |
| KI-09 | MEDIUM | No load, latency or memory measurements | Capacity and model latency unknown | PERFORMANCE_REPORT.md next steps |
| KI-10 | MEDIUM | Rate limits and brute-force protection not tested on the live stack | Abuse resistance unconfirmed | Add tests behind Caddy |
| KI-11 | LOW | Prometheus, Grafana, Loki configured but never run | No monitoring in practice | Run the `monitoring` profile when Docker Hub allows |
| KI-12 | LOW | Container images not scanned | Unknown OS-level CVEs | Add Trivy or Grype to CI **Code written 2026-11-05, not yet verified on the live stack: Trivy scan job in the CI workflow; never run yet** |
| KI-13 | LOW | `/metrics` unauthenticated inside the Docker network | Information exposure if the network is breached | Token or network policy **Code written 2026-11-05, not yet verified on the live stack: optional `VAAKYA_METRICS_TOKEN` bearer check on /metrics, Prometheus reads it from `secrets/metrics_token.txt`; run `init-secrets.sh` once to add it** |
| KI-14 | LOW | eSpeak NG speech is robotic | Poor listening experience | Indic Parler-TTS (T0.07) |
| KI-15 | LOW | Email verification and password-reset flows not tested | Unknown behaviour | Test with a real mail relay |
| KI-16 | LOW | No CI pipeline | Regressions only found when someone runs tests | Add CI **Code written 2026-11-05, not yet verified on the live stack: `.github/workflows/ci.yml` (API normal+RLS, inference, web unit+preview E2E, audits); never run on GitHub yet** |
| KI-17 | LOW | Windows hosts: scripts and data files are sensitive to line endings and encoding | Fixed 2026-11-05 (`.gitattributes`, UTF-8 reads); any new shell script or `read_text()` must follow the same rule | Documented in HANDOVER |

Fixed in the audit (kept for the record): CRLF endings broke Postgres init on Windows; default encoding garbled the rupee sign; CSP missing; CSRF relied on SameSite alone; API docs exposed in production.
