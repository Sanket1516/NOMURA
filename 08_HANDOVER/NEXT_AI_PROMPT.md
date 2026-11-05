# Next AI Prompt

**Generated:** 2026-11-05, after the cloud session finished the code-only items. Paste the block below into the next session (run it on the owner's machine in VS Code: it needs Docker Desktop, Ollama and the GPU). Background and exact state: `08_HANDOVER/HANDOFF_STATUS.md`; checklist: `08_HANDOVER/OWNER_LOCAL_TASKS.md`.

---

```
You are continuing VAAKYA – AI Financial Guardian, a free-and-open-source (D-026) multi-agent financial companion owned by Sanket Mali.
Repository: sanket1516/nomura. All recent work is on branch claude/tender-allen-nshe5u (NOT merged to main; the owner decides when). Local folder: C:\Drive D\Projects\NOMURA. Do not start a new project and do not ask the owner to re-explain history.

FIRST, GET THE CODE
git fetch origin && git checkout claude/tender-allen-nshe5u && git pull. Check git status and git log. If your local main or another local branch differs, tell the owner before merging anything.

READ, IN ORDER
1. 08_HANDOVER/OWNER_LOCAL_TASKS.md  <- your checklist: what a cloud session could not run (live stack, Ollama, CI)
2. 08_HANDOVER/HANDOFF_STATUS.md  (sections 2b, 3a-3c, 6 for commands)
3. 00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md, REMAINING_WORK.md, CHANGELOG.md (newest entries)
4. 05_TESTING/audit/FINAL_PROJECT_AUDIT.md and 05_TESTING/data/SCAM_SET_2_RESULTS.md

WHAT THE LAST (CLOUD) SESSION DID, AND HOW MUCH TO TRUST IT
Run in a Linux container with PostgreSQL 16 (the project targets 18), Chromium, no Docker, no Ollama, no GPU:
- Passed there: API 155 passed + 18 skipped (Neo4j, Qdrant, SeaweedFS tests skip), normal and with VAAKYA_TEST_RLS=1; web unit 28; preview E2E 31 (nonce CSP, axe, hi/mr/kn); offline-lessons E2E against a real API with the browser offline; migration 0004 up/down/up on a database with old rows.
- Written but NEVER run on your stack: /metrics bearer token (VAAKYA_METRICS_TOKEN, init-secrets.sh, prometheus.yml); .github/workflows/ci.yml (never run on GitHub); interface language from the profile on first sign-in (KI-19, needs real Keycloak); web/scripts/load_test.mjs (only tried on a mock, so NO real performance numbers exist); routing regression test (needs Ollama, its floor of 9/12 is unmeasured).
- New features: PWA install button; low-literacy "Simple words" Home view (KI-20, Home only); public no-login lesson API + /lessons pages + Save-for-offline (service worker caches only those pages; signed-in pages and /api are never cached; saved copy is in the language used when saving); consents.lang column (KI-18, migration 0004); second scam set.
- IMPORTANT FINDING: Sentinel recall is 10/28 (36%) on a second, untuned set, with 0/24 false alarms. The earlier 12/12 was on the set the rules were tuned on. Never quote 12/12 as detection accuracy. The rules have NOT been improved yet.
- Translations in hi/mr/kn are unreviewed drafts. Lessons are unreviewed drafts. Schemes are unverified drafts.

YOUR TASKS, IN ORDER (the owner's machine: Windows 11, Docker Desktop, Git Bash, RTX 3050 6 GB, Ollama on the host with gemma:2b and qwen2:7b)
1. OWNER_LOCAL_TASKS sections A and B: rebuild the stack, run API tests (both modes, with the four test containers), live E2E, check the metrics token, language-from-profile through Keycloak, nonce CSP in the real image (revert to the earlier policy and record why if it breaks), PWA install in Chrome/Edge, offline lessons, CI on GitHub. Report real pass/fail counts.
2. Switch on Ollama qwen2:7b for both tiers (HANDOFF_STATUS 3b). Confirm llm_used true on Educator answers, run tests/unit/test_llm_safety.py and tests/integration/test_llm_routing_regression.py (raise FLOOR to what you observe), and the live E2E. Do NOT add Gemini unless the owner explicitly decides and supplies a key. Hindi/Marathi/Kannada generation is unproven: keep translated:false.
3. Check Prometheus targets and Grafana (3c); set a Grafana admin password. Update KI-11.
4. Run web/scripts/load_test.mjs (command in OWNER_LOCAL_TASKS C1) with CHAT=5 model off and on; write the real numbers into 05_TESTING/audit/PERFORMANCE_REPORT.md with date and machine.
5. Improve the Sentinel rules (more patterns, non-English coverage, combination rules like unsolicited + payment + urgency). Then measure on a NEW held-out set, ideally labelled by someone who did not write the rules. Do not tune to scam_set_2 (it is now partly seen). Raise BASELINE_RECALL in tests/unit/test_scam_set_2.py only to what is observed.
6. Remaining code items: KI-10 live Keycloak lockout test; extend the simple low-literacy view beyond Home; set the language cookie on later sign-ins only if the user has not chosen one (already so); KI-15 email flows with a real relay.
7. Update trackers (FEATURE_TRACKER via tools_update_tracker.py, TASK_TRACKER, CHANGELOG, CURRENT_STATUS, HANDOVER, REMAINING_WORK, KNOWN_ISSUES, WORK_SUMMARY, HANDOFF_STATUS, OWNER_LOCAL_TASKS) and ask the owner whether to commit and whether to merge to main.

RULES
- Open-source stack only; record substitutions in DECISIONS_LOG.md.
- Never fake AI output. A missing subsystem returns 503 with the reason and the UI says so. Label rule-based answers llm_used:false.
- Money figures, eligibility and scores are code; language models only explain them.
- Say "processed on VAAKYA's own server", never "on-device".
- Never mark a feature VERIFIED. Do not create a Nomura/ folder.
- Commit as sanket1516 <sanketmali0909@gmail.com> with the Co-Authored-By line, only when the owner asks. Never merge to main without the owner's say.
- Do not claim a test passed unless you ran it. Do not claim translations, lessons or schemes are reviewed. Do not quote any performance or detection number that did not come from a run you did.
- Environment: keep LF endings, read data files as UTF-8, export VAAKYA_DOMAIN=localhost for compose, MSYS_NO_PATHCONV=1 for docker run with container paths. Run docker builder prune -af now and then.

FINAL REPORT
State clearly what was completed, tested (with counts), remaining, mocked and broken, and what the next AI should do.
```
