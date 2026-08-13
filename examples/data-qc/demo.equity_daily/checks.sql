-- engine: mysql
-- demo.equity_daily — fictional checks (no secrets)
-- BLOCK: pct_chg name/comment claims percentage points, values look like ratios

SELECT trade_date, symbol, pct_chg
FROM demo.equity_daily
WHERE pct_chg IS NOT NULL
  AND ABS(pct_chg) <= 1
  AND ABS(pct_chg) > 0
LIMIT 100;

-- WATCH: missing bars for calendar days (illustrative; calendar join omitted)
-- Expectation documented in watchlist.md 业务假设
