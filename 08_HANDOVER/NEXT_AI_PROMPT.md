# Next AI Prompt

**Generated:** 2026-11-05 (late session). Paste the block below into the next session. Background and exact state: `08_HANDOVER/HANDOFF_STATUS.md`.

---

```
You are continuing VAAKYA – AI Financial Guardian, a free-and-open-source (D-026) multi-agent financial companion owned by Sanket Mali.
Repository: sanket1516/nomura, branch main, folder C:\Drive D\Projects\NOMURA. Do not start a new project and do not ask the owner to re-explain history.

READ FIRST, IN ORDER
1. 08_HANDOVER/HANDOFF_STATUS.md  (what is done, what is in flight and unverified, what remains, commands)
2. 00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md and REMAINING_WORK.md
3. 00_PROJECT_MANAGEMENT/HANDOVER.md (rules, code map, Windows notes)
4. 05_TESTING/audit/FINAL_PROJECT_AUDIT.md
Verify claims by running the tests before building on them. Nothing from the last session is committed; check `git status` first.

YOUR TASKS, IN ORDER
1. Finish the nonce-based CSP (HANDOFF_STATUS 3a): run the preview E2E, rebuild the web image, run the live E2E. If it breaks, revert to the previous policy and record why.
2. Switch on the local Ollama model (3b): qwen2:7b for both tiers via VAAKYA_OLLAMA_URL=http://host.docker.internal:11434. Confirm llm_used true on Educator answers, safety review still blocks invented numbers and product pushing, tests and live E2E green. Do NOT add Gemini unless the owner explicitly decides and supplies a key.
3. Check Prometheus targets and Grafana (3c).
4. Work through section 5 of the hand-off in order. Keep every suite green: API (normal and VAAKYA_TEST_RLS=1), inference, web unit, preview E2E, live E2E.
5. Update trackers (FEATURE_TRACKER via tools_update_tracker.py, TASK_TRACKER, CHANGELOG, CURRENT_STATUS, HANDOVER, REMAINING_WORK, KNOWN_ISSUES, WORK_SUMMARY, HANDOFF_STATUS) and ask the owner whether to commit.

RULES
- Open-source stack only. The owner's older prompts name Firebase, Gemini, PaddleOCR and old version pins; the owner confirmed to keep the open-source plan. Record substitutions in DECISIONS_LOG.md.
- Never fake AI output. A missing subsystem returns 503 with the reason and the UI says so. Label rule-based answers llm_used:false.
- Money figures, eligibility and scores are code; language models only explain them.
- Say "processed on VAAKYA's own server", never "on-device".
- Never mark a feature VERIFIED. Do not create a Nomura/ folder.
- Commit to main as sanket1516 <sanketmali0909@gmail.com> only when the owner asks.
- Do not claim a test passed unless you ran it. Do not claim translations are reviewed.
- Environment: Windows 11, Docker Desktop, Git Bash. Keep LF endings, read data files as UTF-8, export VAAKYA_DOMAIN=localhost for compose, MSYS_NO_PATHCONV=1 for docker run with container paths.

FINAL REPORT
State clearly what was completed, tested, remaining, mocked and broken, and what the next AI should do.
```
