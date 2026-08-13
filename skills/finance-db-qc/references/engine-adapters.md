# Engine adapters

Default dialect: **MySQL**. Detect the live engine from connection metadata / user statement; emit **equivalent deliverables** (same `data-qc/...` contract).

| Engine | Metadata | Checks form | Notes |
|--------|----------|-------------|-------|
| **MySQL** (default) | `information_schema` | SQL in `checks.sql` | Baseline templates |
| **PostgreSQL** | `information_schema` / `pg_catalog` | SQL | Map types (`NUMERIC`, timestamps) |
| **ClickHouse** | `system.columns` | SQL | Mind Nullable / DateTime; sampling idioms differ |
| **MongoDB** | `listCollections` / `$jsonSchema` if any | Aggregation / shell in `checks.sql` with header `engine: mongodb` | collection≈table, field≈column |

## Equivalence contract

Regardless of engine, agent must still produce:

- `checks.sql` — runnable probes/assertions in that engine’s language
- `watchlist.md` — 业务假设 + 重点监测
- `report.md` — BLOCK / WATCH / INFO

Do **not** emit fake MySQL for a Mongo target.

## Extending

Add a row to the table above for a new engine; keep deliverable filenames stable (Open/Closed via table rows, not a god-skill rewrite).
