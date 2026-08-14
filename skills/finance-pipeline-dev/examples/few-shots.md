# 正反例

## 正例 1：T+1 定点日频行情管道

**需求**：把 `ods_vendor_daily_bar` 增量加载到 `dwd_cn_stock_daily_bar`（DDL 契约：键 `(sec_code, trade_date, pt)`，分区键 `pt`，事件时间 `trade_date`，摄取时间 `ingest_ts`）。制度确认为 T+1 定点。

**设计**（pipeline.md 摘要）：

- **增量**：时间水位线，`watermark_field = ingest_ts`，晚到容忍 3 天（用户确认）；水位线存状态表。
- **幂等**：`INSERT OVERWRITE PARTITION (pt=...)`，覆盖窗口 = 增量窗口，同窗口重跑结果一致。
- **回补**：`backfill_cn_stock_daily_bar.sql --from 2024-01-01 --to 2024-12-31`，按分区并行、上游就绪检查、回补后行数对账。
- **重跑**：失败从失败分区续跑；重试 3 次指数退避；行数 + 唯一键对账，失败进告警。
- **SLA**：`T+1 08:00 Asia/Shanghai` 可见，延迟 > 30 分钟告警。

**要点**：增量、幂等、回补、重跑全部围绕同一契约（键/分区/时态）；`pipeline.yaml` 引用 `contract.yaml#dwd_cn_stock_daily_bar`，QC 直接拿 `update_regime` 和晚到窗口做 freshness 判定前提。

## 正例 2：披露驱动财务管道

**需求**：财报数据按公告日（`ann_date`）入库，`end_date` 与 `ann_date` 分离（DDL 契约），业绩修正产生同键新版本。

**设计**：

- **增量**：披露驱动，轮询上游新公告，窗口 = 新 `ann_date`；修订产生 (sec_code, end_date, ann_date) 新版本。
- **幂等**：按业务键 upsert；修订靠"可得时间参与去重"覆盖最终态，回测场景保留版本历史。
- **对账**：应到未到按发布日历构造应有集合；修正前后 `net_profit_amt` 变化记录版本，供 QC 解释"数字变了"。

**要点**：不套 T+1 日频节奏；修订不是覆盖历史，是新增可得时间版本。

## 反例 1：无幂等全量重跑

```sql
-- 每天跑：先清全表再插
DELETE FROM dwd_cn_stock_daily_bar;
INSERT INTO dwd_cn_stock_daily_bar SELECT ... FROM ods_vendor_daily_bar;
```

**问题**：DELETE 与 INSERT 非同一事务，中途失败表是空的；全表重跑与增量互踩；重跑一次若 INSERT 失败，线上无数据。正确做法：分区原子替换，窗口参数化。

## 反例 2：水位线丢晚到数据

```sql
-- 增量窗口 = max(ingest_ts) 到当前
WHERE ingest_ts > (SELECT MAX(ingest_ts) FROM state)
```

**问题**：上游晚到 3 天的数据 `ingest_ts` 早于水位线，永远进不来。正确做法：保留晚到容忍窗口 `WHERE ingest_ts > watermark - 3 days`，靠幂等覆盖去重。

## 反例 3：回补硬编码日期

```sql
-- 回补脚本写死
INSERT OVERWRITE ... WHERE trade_date BETWEEN '2024-01-01' AND '2024-06-30'
```

**问题**：下次回补要改代码；窗口不可参数化、不可复用。正确做法：`--from/--to` 参数化，窗口幂等重放。
