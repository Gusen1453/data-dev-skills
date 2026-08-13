# Deliverable contract

Per inspected table/collection, write under the **business project** root:

```text
data-qc/<schema>.<table>/
  checks.sql
  watchlist.md
  report.md
```

For non-SQL engines, keep the **same three filenames and semantics**; `checks.sql` may contain that engine’s equivalent scripts (e.g. Mongo aggregation), with a one-line header stating the engine.

## `checks.sql`

- Re-runnable assertions and probes (prefer “expect 0 rows” for **BLOCK**).
- No credentials. Use env placeholders in comments only if needed (`/* use DATABASE_URL from .env */`).
- Group by check id / severity.

## `watchlist.md`

Required sections:

1. **业务假设** — null allowed? zero allowed? zero≡null? valid ranges; completeness definition; calendar/entity keys
2. **重点监测** — ongoing **WATCH** items with why
3. **Open questions** — unresolved business gaps (do not invent BLOCK thresholds for these)

## `report.md`

- Latest run summary: counts of **BLOCK** / **WATCH** / **INFO**
- Notable findings with sample keys (desensitize before committing)
- Pointers to check ids in `checks.sql`
