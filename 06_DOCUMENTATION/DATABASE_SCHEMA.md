# Database Schema

**Generated** by `04_APPLICATION/api/tools/schema_doc.py` from the code. Do not edit by hand.

Stores: PostgreSQL (system of record), Neo4j (Financial Life Graph, rebuilt from PostgreSQL), SeaweedFS (encrypted documents), Qdrant (public knowledge, Step 4). Firestore and Firebase Storage are replaced by PostgreSQL and SeaweedFS (D-026, D-027).

## PostgreSQL tables

### `outbox`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | BIGINT | no | PK |
| `user_id` | UUID | no |  |
| `topic` | VARCHAR(30) | no |  |
| `payload` | JSONB | no |  |
| `created_at` | DATETIME | no |  |
| `processed_at` | DATETIME | yes |  |
| `attempts` | INTEGER | no |  |

Indexes / unique: `ix_outbox_user_id`

### `schemes`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | VARCHAR(40) | no | PK |
| `data` | JSONB | no |  |
| `rules_version` | VARCHAR(20) | no |  |
| `verification` | VARCHAR(20) | no |  |
| `verified_by` | VARCHAR(80) | yes |  |
| `last_verified_at` | DATE | yes |  |
| `review_due_at` | DATE | yes |  |
| `updated_at` | DATETIME | no |  |

### `users`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `keycloak_sub` | VARCHAR(64) | no |  |
| `status` | VARCHAR(20) | no |  |
| `is_demo` | BOOLEAN | no |  |
| `onboarding_path` | VARCHAR(20) | yes |  |
| `assessment_completed_at` | DATETIME | yes |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `keycloak_sub`

### `consents`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `purpose` | VARCHAR(30) | no |  |
| `version` | VARCHAR(20) | no |  |
| `granted` | BOOLEAN | no |  |
| `at` | DATETIME | no |  |

Indexes / unique: `ix_consents_user_id`

### `conversations`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `title` | VARCHAR(120) | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_conversations_user_id`

### `dataflow_audit`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `request_id` | VARCHAR(40) | no |  |
| `tier` | VARCHAR(10) | no |  |
| `model` | VARCHAR(60) | no |  |
| `categories` | JSONB | no |  |
| `at` | DATETIME | no |  |

Indexes / unique: `ix_dataflow_audit_user_id`

### `documents`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `kind` | VARCHAR(20) | no |  |
| `object_key` | VARCHAR(200) | no |  |
| `sha256` | VARCHAR(64) | no |  |
| `mime` | VARCHAR(40) | no |  |
| `size` | INTEGER | no |  |
| `status` | VARCHAR(20) | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_documents_user_id`

### `events`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `type` | VARCHAR(40) | no |  |
| `payload` | JSONB | no |  |
| `occurred_at` | DATETIME | no |  |

Indexes / unique: `ix_events_user_id`, `ix_events_user_type`

### `financial_items`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `kind` | VARCHAR(12) | no |  |
| `label` | VARCHAR(80) | no |  |
| `category` | VARCHAR(30) | no |  |
| `amount_paise` | BIGINT | no |  |
| `frequency` | VARCHAR(10) | no |  |
| `on_date` | DATE | no |  |
| `source` | VARCHAR(10) | no |  |
| `attributes` | JSONB | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_items_user_date`, `ix_financial_items_user_id`

### `goals`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `type` | VARCHAR(20) | no |  |
| `title` | VARCHAR(80) | no |  |
| `target_paise` | BIGINT | no |  |
| `saved_paise` | BIGINT | no |  |
| `target_date` | DATE | no |  |
| `priority` | INTEGER | no |  |
| `status` | VARCHAR(12) | no |  |
| `idempotency_key` | VARCHAR(64) | yes |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_goals_user_id`, `user_id,idempotency_key`

### `learning_progress`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `module_id` | VARCHAR(40) | no |  |
| `progress_pct` | INTEGER | no |  |
| `completed_at` | DATETIME | yes |  |

Indexes / unique: `ix_learning_progress_user_id`, `user_id,module_id`

### `notifications`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `kind` | VARCHAR(12) | no |  |
| `title` | VARCHAR(120) | no |  |
| `body` | VARCHAR(400) | no |  |
| `href` | VARCHAR(120) | yes |  |
| `read_at` | DATETIME | yes |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_notifications_user_id`

### `preferences`



| Column | Type | Null | Key |
|---|---|---|---|
| `user_id` | UUID | no | PK |
| `data` | JSONB | no |  |

### `profiles`



| Column | Type | Null | Key |
|---|---|---|---|
| `user_id` | UUID | no | PK |
| `display_name` | VARCHAR(80) | no |  |
| `persona` | VARCHAR(20) | yes |  |
| `birth_year` | INTEGER | no |  |
| `occupation` | VARCHAR(80) | no |  |
| `state` | VARCHAR(60) | no |  |
| `district` | VARCHAR(60) | no |  |
| `rural` | BOOLEAN | no |  |
| `preferred_lang` | VARCHAR(2) | no |  |
| `income_type` | VARCHAR(10) | no |  |
| `literacy_level` | VARCHAR(10) | no |  |
| `dependents` | INTEGER | no |  |
| `disability` | VARCHAR(20) | yes |  |
| `attributes` | JSONB | no |  |
| `updated_at` | DATETIME | no |  |

### `questionnaire_responses`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `question_id` | VARCHAR(40) | no |  |
| `answer` | JSONB | no |  |
| `source` | VARCHAR(10) | no |  |
| `at` | DATETIME | no |  |

Indexes / unique: `ix_questionnaire_responses_user_id`, `user_id,question_id`

### `quiz_attempts`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `module_id` | VARCHAR(40) | no |  |
| `correct` | INTEGER | no |  |
| `total` | INTEGER | no |  |
| `answers` | JSONB | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_quiz_attempts_user_id`

### `score_history`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `formula_version` | VARCHAR(10) | no |  |
| `overall` | INTEGER | no |  |
| `dimensions` | JSONB | no |  |
| `reason` | VARCHAR(60) | no |  |
| `computed_at` | DATETIME | no |  |

Indexes / unique: `ix_score_history_user_id`

### `sentinel_checks`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `input_kind` | VARCHAR(20) | no |  |
| `risk_level` | VARCHAR(10) | no |  |
| `risk_indicator` | INTEGER | no |  |
| `signals` | JSONB | no |  |
| `summary` | VARCHAR(200) | no |  |
| `weights_version` | VARCHAR(20) | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_sentinel_checks_user_id`

### `extracted_fields`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `document_id` | UUID | no | FK → documents.id |
| `field` | VARCHAR(40) | no |  |
| `value` | JSONB | no |  |
| `confidence` | DOUBLE | yes |  |
| `confirmed_value` | JSONB | yes |  |

Indexes / unique: `ix_extracted_fields_user_id`, `ix_extracted_fields_document_id`

### `goal_contributions`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `goal_id` | UUID | no | FK → goals.id |
| `amount_paise` | BIGINT | no |  |
| `on_date` | DATE | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_goal_contributions_user_id`, `ix_goal_contributions_goal_id`

### `messages`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `conversation_id` | UUID | no | FK → conversations.id |
| `role` | VARCHAR(10) | no |  |
| `content_redacted` | TEXT | no |  |
| `agents` | JSONB | no |  |
| `citations` | JSONB | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_messages_conversation_id`, `ix_messages_user_id`

### `plans`



| Column | Type | Null | Key |
|---|---|---|---|
| `id` | UUID | no | PK |
| `user_id` | UUID | no | FK → users.id |
| `goal_id` | UUID | no | FK → goals.id |
| `calc_version` | VARCHAR(20) | no |  |
| `inputs` | JSONB | no |  |
| `outputs` | JSONB | no |  |
| `feasibility` | VARCHAR(30) | no |  |
| `created_at` | DATETIME | no |  |

Indexes / unique: `ix_plans_goal_id`, `ix_plans_user_id`

## Ownership and access

* Every user-owned table has `user_id` (FK to `users`, `ON DELETE CASCADE`, indexed).
* Services fetch rows with `get_owned(model, id, user_id)`; another user's id returns 404 (tested, mutation-checked).
* `user_id` comes only from the verified token.

## Retention (`services/retention.py`)

| Rule | Kept for |
|---|---|
| messages | 365 days |
| notifications_read | 90 days |
| outbox_processed | 7 days |
| dataflow_audit | 365 days |

Voice audio and scam screenshots are never stored. Documents stay until the user deletes them or the account. Account erase removes all rows, vault objects and graph nodes.

## Neo4j Financial Life Graph (`stores/graph.py`)

```text
Financial Life Graph gateway (FR-FLG-01, -09). The ONLY module that talks to Neo4j.

Rules: named queries only; every query is anchored on (u:User {id: $user_id}); every value is a parameter.
Neo4j Community has no per-user access control, so isolation lives here and is tested with two users.
PostgreSQL is the system of record (D-010): a user's subgraph is rebuilt idempotently from a snapshot.

Model (DATABASE_ARCHITECTURE §3, relationship names per the data-layer brief):
  (User)-[:HAS_INCOME]->(Income)        (User)-[:HAS_EXPENSE]->(Expense)
  (User)-[:HAS_GOAL]->(Goal)            (User)-[:HAS_RISK]->(Risk)-[:MITIGATED_BY]->(Goal)
  (User)-[:ELIGIBLE_FOR {status}]->(Scheme)
  (User)-[:COMPLETED]->(LearningModule)-[:COVERS]->(KnowledgeTopic)
  (User)-[:RECEIVED]->(Recommendation)-[:ADDRESSES]->(Risk|Goal)
  (User)-[:CHECKED]->(ScamCheck)
Shared, ownerless nodes: Scheme, LearningModule, KnowledgeTopic. All other nodes carry owner = user id.
```

Constraints and indexes:

* `CREATE CONSTRAINT user_id IF NOT EXISTS FOR (n:User) REQUIRE n.id IS UNIQUE`
* `CREATE CONSTRAINT scheme_id IF NOT EXISTS FOR (n:Scheme) REQUIRE n.id IS UNIQUE`
* `CREATE CONSTRAINT module_id IF NOT EXISTS FOR (n:LearningModule) REQUIRE n.id IS UNIQUE`
* `CREATE CONSTRAINT topic_id IF NOT EXISTS FOR (n:KnowledgeTopic) REQUIRE n.id IS UNIQUE`
* `CREATE CONSTRAINT goal_id IF NOT EXISTS FOR (n:Goal) REQUIRE n.id IS UNIQUE`
* `CREATE INDEX owner_income IF NOT EXISTS FOR (n:Income) ON (n.owner)`
* `CREATE INDEX owner_expense IF NOT EXISTS FOR (n:Expense) ON (n.owner)`
* `CREATE INDEX owner_goal IF NOT EXISTS FOR (n:Goal) ON (n.owner)`
* `CREATE INDEX owner_risk IF NOT EXISTS FOR (n:Risk) ON (n.owner)`
* `CREATE INDEX owner_rec IF NOT EXISTS FOR (n:Recommendation) ON (n.owner)`
* `CREATE INDEX owner_scam IF NOT EXISTS FOR (n:ScamCheck) ON (n.owner)`

Named queries: `sync_user`, `context`, `twin`, `eligible_unreviewed`, `unmitigated_risks`, `erase_user`. All anchored on `$user_id`.

## SeaweedFS document vault (`stores/vault.py`)

Bucket `vaakya-user-docs`, key `{userId}/{yyyy}/{mm}/{documentId}`. AES-256-GCM envelope encryption with the object key as associated data.
