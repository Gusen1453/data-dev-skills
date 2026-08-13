---
name: using-data-dev
description: >-
  Use when starting any data-development conversation, or when unsure which
  data-dev skill applies — database QC, schema/DDL review, ETL/pipeline data
  checks, financial time-series or cross-section quality, field naming vs value
  conventions, missing/null/outlier sampling — before deep work. Single entry
  and smart router for the data-dev-skills suite.
---

# Using data-dev

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

## When to use

- Session start in a workspace that uses **data-dev-skills**
- Unsure which data-dev skill applies
- User mentions 库表质检、数据质量、DDL、缺失值、异常值、时序/截面完备、字段名与取值不一致、金融数据校验

## How to use

1. Match the task to the **Skill map** below.
2. Announce `Using <skill> to …`, read that skill, follow it.
3. Do **not** open a database or write `data-qc/` from this router — only route.

## Skill map

| Situation | Skill |
|-----------|--------|
| Financial / market / factor table QC; null/missing/outliers; time-series or cross-section completeness; DDL/types/names/comments; naming/description vs actual value conventions | **finance-db-qc** |
| Unsure which data-dev skill | Stay on **using-data-dev**, then pick from this table |

```
using-data-dev
  → finance-db-qc   (table/collection quality + deliverables)
  → (future skills) ETL / reconcile / …
```

## Checklist

- [ ] data-dev-skills installed (else → README install)
- [ ] Relevant skill identified
- [ ] That skill read and followed; announced
