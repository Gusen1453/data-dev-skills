# Report — demo.equity_daily (fictional run)

| Severity | Count |
|----------|------:|
| BLOCK | 1 |
| WATCH | 2 |
| INFO | 3 |

## Findings

### BLOCK — 命名/描述一致性（刻度）

- Field `pct_chg` description claims percentage points; sampled values cluster in `[-0.2, 0.2]` like ratios.
- Class: **naming/description vs actual value convention** (not a one-off tip).
- See `checks.sql` probe.

### WATCH

- Sparse coverage for newly listed symbols in last 5 sessions.
- Suspension days: NULL close with volume 0 — aligned with 业务假设 but keep monitoring vendor changes.

### INFO

- Rows sampled: 50_000; date span: 2020-01-02 .. 2024-12-31; symbols: ~5_000 (fake stats).
