# 投研场景建表范式

本节给各投研场景的推荐键、时态列、单位与复权口径。**字段名是建议，跟随库内惯例优先**；示例值为脱敏占位，不是可照抄的真实口径。

## 目录

1. 通用设计决策
2. 证券主数据与代码体系
3. 交易日历
4. 行情与复权
5. 财务报表与估值
6. 公告与事件
7. 指数与基金
8. 宏观与行业

## 1. 通用设计决策

- **键。** 复合自然键 `(sec_code, 时间, 来源/版本)`；跨市场时 `(market, sec_code)` 一起出现。
- **时态。** 三列分离（事件/可得/摄取），见 `partitioning.md`。
- **单位与币种。** 价格、金额、数量、比例单位写注释；跨市场加 `currency`。
- **版本。** 供应商修订、回补、更正用 `(业务键, 可得时间)` 唯一或 `data_version` 列，不覆盖历史。
- **来源。** 多供应商同库并存时加 `data_src` 列（`wind`、`choice`、`datacenter` 等，跟随库内枚举）。

## 2. 证券主数据与代码体系

主数据表是所有行情/财务/事件 join 的锚点，代码体系处理不当直接导致跨表错位。

- **主键**：`(market, sec_code)` 或 `sec_code`（单市场）；名称变更用**历史表**，不在主表覆盖。
- **代码体系**：A 股 6 位数字（`000001`）、H 股 5 位（`00700`）、美股 ticker（`AAPL`、`BRK.B`）。**代码一律 VARCHAR 存，保留前导零与大小写**；跨市场统一前先规格化（如 `SH600000`）。
- **关键列**：`sec_code`、`sec_name`、`market`/`exchange_cd`、`sec_type`（股票/指数/基金/债券/外汇）、`list_status`（上市/退市/暂停）、`list_date`、`delist_date`、`currency`。
- **反例**：`code INT` 丢前导零；名称变更直接 UPDATE 主表导致历史 join 错位；一个代码体系（如中证指数代码）混进股票代码体系。

## 3. 交易日历

- **主键**：`(market, trade_date)`；A/H/美股日历不同，按市场分行。
- **关键列**：`trade_date`、`is_trade_date`、`pre_trade_date`、`next_trade_date`（或由查询推导，但预计算列省 join）、`holiday_reason`（休市原因，可空）。
- **用途**：连续性质检、复权对齐、回测"下一个交易日"。
- **反例**：用自然日当交易日；把港股圣诞休市算作"数据断档"。

## 4. 行情与复权

- **主键**：日频 `(sec_code, trade_date)`；分钟级 `(sec_code, trade_date, minute_ts)`。
- **原始价与复权价分离。** 一张表存未复权 OHLCV + `adj_factor`，复权价由因子派生（或单独复权表），**不要**把前复权值直接覆盖原始价——前复权随最新除权变化，覆盖后历史不可重建。
- **关键列**：`open_price`、`high_price`、`low_price`、`close_price`、`volume_qty`（股）、`turnover_amt`（元）、`chg_rate`、`adj_factor`、`is_suspended`。
- **复权因子口径**：后复权因子 `adj_factor`（累计），前复权 = 后复权 / 最新因子；除权除息事件单独成表（`ex_date`、`dividend_per_share`、`bonus_ratio` 等）。口径（前复权/后复权/不复权）必须写进表注释与契约。
- **停牌与零成交**：停牌日保留行并置 `is_suspended=1`，还是完全缺行——**二选一并在契约声明**；质检与回测依赖该约定。
- **反例**：`FLOAT` 存价格；复权价覆盖原始价；`volume` 不写单位（股 vs 手）。

## 5. 财务报表与估值

- **主键**：`(sec_code, end_date, ann_date)` 或 `(sec_code, end_date, report_type, data_src)`；同一报告期多次披露（快报/正式/更正）靠 `ann_date` 区分版本。
- **报告期与公告日分离**：`end_date`（Q1 报 3-31、中报 6-30、三季报 9-30、年报 12-31）与 `ann_date`（披露日，PIT 关键）**必须两列**。
- **原始报表与派生指标分层**：`ods_` 存原始报表科目，`dws_` 存 TTM/单季/同比派生；派生口径（TTM 算法、并表范围）写注释与契约，防止"谁算的 TTM"各说各话。
- **关键列**：`revenue_amt`、`net_profit_amt`、`total_assets_amt`、`eps`、`roe_rate`、`currency`；货币单位（元/万元/亿元）统一并在注释声明。
- **估值指标**：`pe_rate`、`pb_rate`、`ps_rate`、`dv_ratio`；**市值与估值必须与行情时点对齐**（用哪个 `trade_date` 的价格算的），否则跨表对不上。
- **反例**：`end_date` 与 `ann_date` 合并成一列；`float` 存 EPS；TTM 算法只存在于代码注释里。

## 6. 公告与事件

- **主键**：`(ann_id, sec_code)`；`ann_id` 用交易所公告编号。
- **关键列**：`ann_date`（披露日）、`ann_title`、`ann_type`（公告分类，枚举字典）、`content_text` 或文件链接、`publish_ts`。
- **结构化事件**：从文本抽取的事件（分红送转、股权变动、业绩预告）单独成表，`source_ann_id` 指回公告原文，保证可溯源。
- **事件到标的映射**：公告可能涉及多标的（并购双方），用 `(ann_id, sec_code)` 明细表而非一公告一行。
- **反例**：公告日期用"收到日期"冒充"披露日"；抽取事件丢了 `source_ann_id`，无法回查原文。

## 7. 指数与基金

- **指数**：主键 `(index_code, trade_date)`；与股票行情同构（OHLCV），但注意指数无成交量时用成交额；指数代码体系独立于股票代码。
- **基金净值**：主键 `(fund_code, nav_date)`；关键列 `nav`（单位净值）、`acc_nav`（累计净值）、`nav_date`、`currency`；估值日与净值公布日（`publish_ts`）分离。
- **份额与规模**：`total_shares_qty`、`fund_scale_amt`、`net_inflow_amt`（申赎）；分红单独事件表。
- **成分股权重**：主键 `(index_code, sec_code, eff_date)`；权重随时间变化，**禁止覆盖历史权重**；`eff_date` 与 `ann_date`（调仓公告日）分离。
- **反例**：净值表用"公布日"覆盖"净值归属日"；指数成分权重只存最新，回测历史成分无从谈起。

## 8. 宏观与行业

- **宏观指标**：主键 `(indicator_code, period_end)`；关键列 `indicator_code`、`period_end`（指标归属期）、`release_date`（发布日，PIT）、`value`、`prev_value`、`forecast_value`、`unit`、`freq`（月/季/年）。
- **行业分类**：多套体系并存（证监会、申万、中信、GICS），**分类表必须带体系列** `classify_src`；主键 `(sec_code, classify_src, eff_date)`，行业归属变化不覆盖历史。
- **题材/概念映射**：主键 `(theme_code, sec_code, start_date, end_date)`；题材时效性必须建模（有生效起止），"某某概念股"的标签污染是质检高频问题。
- **反例**：宏观 `value` 不写单位与频率；行业分类不带 `classify_src`，申万三级混进中信体系；题材表只有"当前成分"，无法回答"2024 年 X 题材有哪些股票"。
