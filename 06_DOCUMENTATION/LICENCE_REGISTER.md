# Licence Register

**Started:** 2026-11-05 (T0.06) | **Policy:** D-026, NFR-LIC-01 | **Owner:** Sanket Mali

Every runtime component, dependency set and model must appear here **before** it is added (Roadmap gate rule 7).

| Verification | Meaning |
|---|---|
| **VERIFIED** | Read from the artefact itself: package metadata, a licence file or SBOM inside the image, or an OCI label |
| **UNVERIFIED** | From documentation or general knowledge only. Must be verified before the component is used |
| **N/A** | Not yet selected |

Automated checks (spike, to become the T1.08 gate):

- Python: `02_ARCHITECTURE/evaluations/T0.06_stack/api/licence_check.py`, fed by `pip-licenses`. All 155 distributions pass.
- npm: `02_ARCHITECTURE/evaluations/T0.06_stack/web/licence_check.mjs`. All 126 lockfile packages pass.
- Allowed: MIT, BSD, Apache-2.0, ISC, PSF/Python-2.0, MPL-2.0, Zlib, CC0, Unlicense, HPND, AFL, LGPL. Anything else needs a human decision recorded here.

## Copyleft decisions

| Component | Licence | Decision | Why |
|---|---|---|---|
| psycopg 3.3.8 | LGPL-3.0-only | Accepted | OSI-approved weak copyleft. Used unmodified and dynamically imported. |
| Neo4j Community 5.26 | GPLv3 | Accepted (D-007) | Runs unmodified as a separate server. VAAKYA talks to it over Bolt. If Neo4j is ever modified and distributed, its source must be shared. |
| Grafana OSS 13, Loki 3.7 | AGPLv3 | Accepted for unmodified use | Separate operator-only processes. If either is modified and exposed to users over a network, the modified source must be offered. |
| eSpeak NG | GPLv3 | Pending T0.07 | Fallback TTS only. Run it as a separate process. |

## Runtime services

| Component | Version | Licence | Verification | Evidence |
|---|---|---|---|---|
| PostgreSQL | 18.6 | PostgreSQL License | VERIFIED | Debian copyright file in `postgres:18` |
| Neo4j Community | 5.26.32 | GPLv3 | VERIFIED | `LICENSE.txt` in `neo4j:5.26-community` |
| Qdrant | 1.20.0 | Apache-2.0 | VERIFIED | SPDX SBOM in `qdrant/qdrant:v1.20.0` |
| SeaweedFS | 4.50 | Apache-2.0 | VERIFIED | OCI label on `chrislusf/seaweedfs:4.50` |
| Keycloak | 26.8.1 | Apache-2.0 | VERIFIED | `LICENSE.txt` in `keycloak/keycloak:26.8.1` |
| Caddy | 2.11.8 | Apache-2.0 | VERIFIED | OCI label on `caddy:2` |
| Prometheus | latest | Apache-2.0 | VERIFIED | OCI label on `prom/prometheus` |
| Grafana OSS | 13.0.2 | AGPLv3 | VERIFIED | `LICENSE` in `grafana/grafana-oss` |
| Loki | 3.7.9 | AGPLv3 | UNVERIFIED | Image has no licence file or label |
| Ollama | - | MIT reported | UNVERIFIED | Not pulled. Verify in T0.03 |
| OpenTelemetry Collector | - | Apache-2.0 reported | UNVERIFIED | Not selected |

## Application dependency sets

| Set | Lockfile | Licence result | Verification |
|---|---|---|---|
| API (Python 3.13) | `02_ARCHITECTURE/evaluations/T0.06_stack/api/uv.lock` | 155/155 allowed | VERIFIED, `05_TESTING/evaluations/T0.06/api_licence_report.txt` |
| Web (Next.js 16) | `02_ARCHITECTURE/evaluations/T0.06_stack/web/package-lock.json` | 126/126 allowed | VERIFIED, `05_TESTING/evaluations/T0.06/web_licence_report.txt` |
| ShadCN components | Copied into the app in T1.02 | MIT reported (CLI 4.23.0 is MIT) | Verify in T1.02 |

Key API packages: FastAPI MIT, LangGraph MIT, LlamaIndex MIT, qdrant-client Apache-2.0, neo4j driver Apache-2.0, Presidio MIT, APScheduler MIT, boto3 Apache-2.0. Full list in the T0.06 results.

## Inference engines and models

All pending their Phase 0 evaluations. **None may be used until verified here.**

| Component | Task | Reported licence | Verification |
|---|---|---|---|
| Private Tier LLM | T0.03 | Apache-2.0 or MIT required | N/A |
| Reasoning Tier LLM | T0.03 | Apache-2.0 or MIT required | N/A |
| faster-whisper, Whisper large-v3 weights | T0.08 | MIT | UNVERIFIED |
| Indic Parler-TTS | T0.07 | Apache-2.0 reported, commercial terms disputed | UNVERIFIED |
| eSpeak NG | T0.07 | GPLv3 | UNVERIFIED |
| IndicTrans2 code and checkpoints | T0.09 | MIT | UNVERIFIED |
| multilingual-e5-large | T0.10 | MIT | UNVERIFIED |
| PaddleOCR, PaddlePaddle | T0.13 | Apache-2.0 | UNVERIFIED |
| Tesseract | T0.13 | Apache-2.0 | UNVERIFIED |
| spaCy language model for Presidio | T0.04 | MIT reported for `en_core_web_*` | UNVERIFIED |

## Rejected

| Component | Reason |
|---|---|
| Coqui XTTS weights | Non-commercial licence |
| MinIO | Community edition no longer actively developed (D-024) |
| Llama and other custom-licence models | Not an open licence (D-026) |
| Firebase, AWS, Gemini, OpenAI, Claude, hosted speech | Proprietary or paid (D-026) |
