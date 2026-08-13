# Semantic conventions (naming / description vs values)

This is a **class** of defects: what the **name + comment/description** claim about units, scale, encoding, or domain does not match **actual stored values**.

Percentage / 涨跌幅 examples are **illustrative only**, not the full scope.

## Pattern

1. Infer claimed convention from name + comment + table docs (e.g. `%`, `pct`, `是否`, `万元`, `YYYYMMDD`, `code`, `rate`).
2. Probe actual distribution: min/max/quantiles, distinct values, string patterns, null/zero rates.
3. Under 业务假设, decide: conflict → **BLOCK** or **WATCH**; document “宣称规范 vs 实际取值”.

## Example families (non-exhaustive)

| Claimed by name/desc | Suspicious actual | Notes |
|----------------------|-------------------|-------|
| Percentage points (20 = 20%) | Values in \[-1, 1\] like `0.2` | Scale mismatch |
| Ratio / decimal | Values like `20` | Opposite scale mismatch |
| Boolean / 是否 | Values `{0,1,2}` or many strings | Encoding mismatch |
| Amount in 万元 | Magnitudes imply 元 | Unit mismatch |
| Date `YYYYMMDD` char | Mixed `YYYY-MM-DD` | Format mismatch |
| Status code table | Free text or unexpected codes | Enum mismatch |
| Price / volume non-negative | Frequent negatives (unless short/adj) | Domain mismatch |

## Agent duties

- Classify findings under **语义口径 / 命名描述一致性**, not as a one-off field tip.
- Prefer reusable `checks.sql` predicates (range, regex, distinct-set) over one-time narrative.
- If convention is ambiguous → ask; put gap in `watchlist.md` Open questions.
