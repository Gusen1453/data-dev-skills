# Watchlist — demo.equity_daily

Fictional example only.

## 业务假设

- `trade_date` + `symbol` unique; A-share calendar completeness expected on trading days only
- `pct_chg` comment claims “涨跌幅（%）” → **percentage points** (20 means 20%), not ratio
- NULL not allowed on `close`; `volume = 0` allowed on suspensions; `0` is not NULL
- Completeness: every listed symbol has a row on each trading day it was listed

## 重点监测

- **WATCH:** Sparse symbols near IPO / delist windows
- **WATCH:** Suspended days with NULL OHLC vs zero volume — confirm vendor rule

## Open questions

- None for this demo
