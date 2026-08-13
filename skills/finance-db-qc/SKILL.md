---
name: finance-db-qc
description: >-
  Database quality inspection for financial and market data (time-series and
  cross-section): missing/null/outliers with sampling stats; DDL/types/names/
  comments; naming/description vs actual value conventions; completeness under
  business assumptions. Use when the user asks for 库表质检、数据质量、DDL检查、
  缺失异常、时序截面完备、字段名与取值不一致, or when using-data-dev routes here.
  Writes re-runnable checks and per-table watchlists under data-qc/.
---

# Finance DB QC

Announce: `Using finance-db-qc to …`

## Iron laws

1. **Understand before thresholds** — DDL + light profiling + business answers → write **业务假设** in `watchlist.md`, then choose sampling and BLOCK/WATCH rules (null allowed? zero allowed? zero≡null? ranges? completeness?).
2. **Read-only** by default; credentials via `.env` / explicit connection — see `references/security-credentials.md`. Hardcode → 立即告警并合规化.
3. **Four layers, in order** — see `references/check-catalog.md`. Do not skip semantic口径.
4. **Deliverables** — business project `data-qc/<schema>.<table>/` per `references/deliverable-contract.md`.

## Workflow

1. **Connect** — user-explicit or `.env`; detect engine; load `references/engine-adapters.md`.
2. **Security pass** — ensure no secrets will be written into artifacts.
3. **Structure / metadata** — names, types, comments; identify time & entity keys.
4. **Probe** — null/zero rates, distributions, time span, entity counts (sample appropriately for size).
5. **业务假设** — synthesize; **ask on gaps**; record in `watchlist.md` before inventing BLOCK predicates.
6. **Semantic口径** — naming/description vs actual value conventions (**whole class**): `references/semantic-conventions.md`.
7. **时空质量** — gaps, cross-section alignment, outliers/ranges/completeness under assumptions.
8. **Severity** — assign **BLOCK** / **WATCH** / **INFO**.
9. **落盘** — `checks.sql`, `watchlist.md`, `report.md`; re-scan for secrets.

## References (read as needed)

- `references/check-catalog.md`
- `references/semantic-conventions.md`
- `references/engine-adapters.md`
- `references/deliverable-contract.md`
- `references/security-credentials.md`

## Checklist

- [ ] Engine known; adapter applied
- [ ] 业务假设 written (or open questions listed — no fake BLOCKs)
- [ ] Four layers covered
- [ ] Naming/description consistency treated as a class, not one toy field
- [ ] Three deliverables written; no hardcoded secrets
