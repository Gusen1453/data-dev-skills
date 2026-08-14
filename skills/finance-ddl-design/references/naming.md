# 命名规范

命名是数据契约的第一层：下游查询、质检、文档都按名字找字段。规则分两层——**通用规则**（本 skill 硬性）与**库内惯例**（跟随现有库）。先读 `exploration.md` 提取惯例，再按本节裁决。

## 通用规则

1. **snake_case 小写。** 表名、列名、索引名一律小写蛇形；禁止驼峰、禁止大小写混用、禁止依赖引号。
2. **不用保留字。** 列名避开引擎保留字（`date`、`order`、`group`、`rank` 等）；确需使用必须加引号并记录，宁可改名。
3. **名词在前、定语在后。** `daily_bar`、`trade_calendar`、`adjust_factor`，不要 `bar_daily`。
4. **一个概念一个名字。** 同一语义字段跨表同名同类型；同义词（`code` vs `sec_code` vs `security_code`）禁止并存，除非是库内强惯例且无法改变——此时在契约里声明别名。
5. **表名分层前缀。** 数仓分层惯例（源自阿里数仓规范，见 `external-standards.md`）：

   | 前缀 | 层 | 内容 |
   |---|---|---|
   | `ods_` | 贴源 | 供应商原始数据，尽量原样 |
   | `dwd_` | 明细 | 清洗后明细，业务主键明确 |
   | `dws_` | 汇总 | 主题宽表、派生指标 |
   | `ads_` | 应用 | 面向报告/应用的成品表 |
   | `dim_` | 维度 | 主数据、字典、日历 |
   | `tmp_` | 临时 | 一次性加工，生命周期短 |

   库内已有其他分层前缀时，**跟随库内惯例**，不强行引入新前缀。
6. **表名粒度后缀。** 频率或粒度写进表名：`daily_bar`、`minute_bar`、`quarterly_financial`；同表不同市场加市场域：`cn_stock_daily_bar`、`hk_stock_daily_bar`（前缀跟随库内惯例）。
7. **列名语义后缀。** 固定后缀帮助下游猜语义：

   | 后缀 | 含义 | 示例 |
  |---|---|---|
   | `_code` / `_cd` | 代码（字符串） | `sec_code`、`exchange_cd` |
   | `_id` | 业务标识 | `event_id`、`report_id` |
   | `_nm` / `_name` | 名称 | `sec_name`、`ind_name` |
   | `_date` | 日粒度业务日期 | `trade_date`、`ann_date` |
   | `_dt` | 日期时间/分区 | `pt`、`update_dt` |
   | `_ts` | 时间戳（带时区） | `publish_ts` |
   | `_amt` | 金额 | `turnover_amt`、`net_profit_amt` |
   | `_qty` | 数量 | `volume_qty`、`shares_qty` |
   | `_price` | 价格 | `close_price`、`adj_close_price` |
   | `_rate` | 比率/收益率 | `chg_rate`、`pe_rate` |
   | `_cnt` | 计数 | `trade_cnt` |
   | `_flag` | 标志（0/1） | `is_trading_flag` |
   | `_status` | 状态枚举 | `list_status` |

   库内已有不同后缀惯例（如全库用 `_cd` 而不用 `_code`），跟随库内惯例。
8. **布尔列用 `is_`/`has_` 前缀**：`is_trading`、`has_adjust`。避免 `flag=2` 式魔法数；枚举状态用 `_status`。
9. **时间三列命名**：事件时间 `*_date`/`*_ts`、可得时间 `*_avail_ts`（或 `pub_ts`）、摄取时间 `ingest_ts`。职责不清时用 `partitioning.md` 的时态设计。

## 索引与约束命名

- 主键：`pk_<table>`。
- 唯一键：`uk_<table>_<col1>_<col2>`。
- 普通索引：`idx_<table>_<col1>_<col2>`。
- 外键：`fk_<table>_<ref_table>`（投研数仓一般不用物理外键，用契约声明关系；确需时命名如上）。
- 分区键列不强制命名规则，但分区键必须进入主键/唯一键（见 `partitioning.md`）。

## 投研常用字段命名（与 finance-data-qc 对齐）

这些是跨库共识名，新表优先使用；库内已有等价强惯例时跟随库内：

| 概念 | 建议名 | 说明 |
|---|---|---|
| 证券代码 | `sec_code` | 字符串，保留前导零；见 `types-constraints.md` |
| 市场/交易所 | `market` / `exchange_cd` | 枚举（如 `SH`、`SZ`、`HK`、`US`） |
| 交易日 | `trade_date` | `DATE`，按交易日历 |
| 公告日 | `ann_date` | 公告披露日（PIT 近似） |
| 报告期 | `end_date` | 财务报告所属期 |
| 币种 | `currency` | ISO 代码（`CNY`、`HKD`、`USD`） |
| 复权因子 | `adj_factor` | 后复权因子，见 `investment-research.md` |
| 是否交易日 | `is_trade_date` | 交易日历标志 |
| 行业代码 | `ind_code` | 行业分类代码 |
| 分类体系 | `classify_src` | 申万/中信/证监会等体系来源 |

## 注释语言

- 表注释与列注释用中文写口径与单位；技术标识（如引擎、调度）保留英文。
- 列注释格式：`<口径说明>；单位：<单位>；来源：<来源>`；示例值用脱敏值（如 `示例：600000（脱敏）`）。
- 枚举列注释列出全部取值含义；NULL 的含义（"未知"还是"不适用"）必须在注释或契约中声明。

## 反例

- `StockDailyBar`、`stock_daily_bar` 混用大小写。
- `t1`、`col_a`、`data` 无意义命名。
- `close`（保留字/语义不明）、`price`（哪个价格）。
- 同一库内 `code` 与 `sec_code` 并存且含义相同。
- `amount` 不写单位：是元、万元还是亿元。
