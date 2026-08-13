# Check catalog

## Severity

| Level | Meaning | Deliverable |
|-------|---------|-------------|
| **BLOCK** | Hard defect or clear semantic conflict | Assert in `checks.sql` (expect 0 bad rows); red in `report.md` |
| **WATCH** | Suspicious / sparse / needs ongoing monitor | `watchlist.md` 重点监测 |
| **INFO** | Distribution / sampling stats | `report.md` only |

## Four layers (mandatory order)

### 1. 结构 / 元数据

- Table/collection name; column/field names; types; comments/descriptions
- Identify time key, entity key, primary/unique keys if present

### 2. 语义口径

- **Naming/description vs actual value conventions** (whole class — see `semantic-conventions.md`)
- Enums, codes, units, scales, date formats

### 3. 时空完备与质量

- Time-series gaps; cross-section alignment; null / zero / zero≡null under 业务假设
- Reasonable ranges and outliers **after** assumptions are written
- Completeness definition from business (trading calendar, listed universe, etc.)

### 4. 落盘守门

- Write `checks.sql`, `watchlist.md`, `report.md` per `deliverable-contract.md`
- Re-scan artifacts for secrets per `security-credentials.md`

## Iron law

**Do not invent BLOCK thresholds before 业务假设.** Probe first; ask on gaps; then encode checks.
