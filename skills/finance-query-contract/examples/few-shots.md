# 正反例

## 正例 1：封装消歧服务的行情查询

**需求**：AI 工具要能回答"XX 今天收盘多少"。数据源 `dwd_cn_stock_daily_bar`（DDL 契约：`close_price` 单位元、`chg_rate` 百分数、`turnover_amt` 单位元）。消歧已有内部服务（批量查询，返回 top-1 标准化代码），查询接口内部封装。

**入参**：`instruments: ["茅台", "GOOG", "bj920799", "spacex"]`、`trade_date`（必填）、`fields`（可选）——不标准输入直接收。

**接口内部流程**：批量调消歧服务 → 取每条 top-1 标准化代码 → 用代码查行情 → 组出参。

**出参**（结构化，节选）：

```json
{
  "query_id": "quote_daily",
  "data": [
    {"matched_input": "茅台", "code": "600519.XSHG", "name": "贵州茅台",
     "trade_date": "2024-01-15", "close_price": {"value": 7.25, "unit": "元"},
     "chg_rate": {"value": 1.2, "unit": "%"}},
    {"matched_input": "GOOG", "code": "GOOG.XNAS", "name": "谷歌C",
     "trade_date": "2024-01-15", "close_price": {"value": 141.8, "unit": "美元"}},
    {"matched_input": "bj920799", "code": "920799.XBEI", "name": "艾融软件",
     "trade_date": "2024-01-15",
     "close_price": {"value": null, "absence_reason": "NON_TRADING", "message": "非交易日（休市）"}}
  ],
  "as_of": "2024-01-16T09:00:00+08:00", "source": "vendor_x v2.1"
}
```

**json→str**：

> 共 3 条：贵州茅台（600519.XSHG）1 月 15 日收盘 7.25 元，涨跌幅 +1.2%；谷歌C（GOOG.XNAS）1 月 15 日收盘 141.8 美元；艾融软件（920799.XBEI）1 月 15 日非交易日（休市）。数据截至 1 月 16 日 09:00，来源 vendor_x v2.1。

**要点**：不标准输入直接收；消歧 top-1 直接用于查询，不做候选/置信度处理；休市按口径诚实输出。

## 正例 2：消歧无命中诚实告知

**入参**：`instruments: ["不存在的公司xyz"]`。

**出参转写**：

> 未查到该标的（不存在的公司xyz）：消歧服务无匹配结果，已跳过。共 0 条数据。

**要点**：消歧无命中 → `NOT_FOUND`，不猜、不编造代码，如实告知。

## 正例 3：模块化出参（批量快照 + 筛选回显）

**需求**：批量查财务快照 + 一轮筛选，出参要模块化、条件可评估。

**快照出参**（按原输入键控，消歧内嵌块，空数组 = 暂无）：

```json
{"data": {
  "贵州茅台": {"standardizedInfo": {"code": "600519.XSHG", "name": "贵州茅台", "fullCode": "sh600519"},
              "items": [{"reportPeriod": "2026-03-31", "reportType": "Q1",
                         "netProfit": {"value": "27,239,985,194", "unit": "元"},
                         "peTtm": {"value": "20.48", "unit": "倍"}}]},
  "TSLA": {"standardizedInfo": {"code": "TSLA.XNAS", "name": "特斯拉", "fullCode": "usTSLA"},
           "items": []}
}}
```

**筛选出参**（分页块 + 条件回显块 + 结果主体）：

```json
{"data": {
  "pageInfo": {"total": 491, "page": 1, "size": 20, "totalPages": 25},
  "numberConditionCount": {"changePct": {"desc": "最新涨跌幅", "range": "-5% ~ 10%", "count": 5527},
                           "marketCap": {"desc": "总市值", "range": ">100亿", "count": 1842}},
  "enumConditionCount": {"concept": {"desc": "概念", "items": [{"value": "高股息", "count": 145}], "totalCount": 898}},
  "stockList": [{"code": "688146", "fullCode": "sh688146", "name": "中船特气",
                 "marketCap": 1586.11764794, "marketCapDisplay": "1,586.12",
                 "concept": ["半导体概念", "半导体材料"]}]
}}
```

**json→str**：

> 贵州茅台（600519.XSHG）2026 年 Q1 净利润约 272.4 亿元，PE(TTM) 20.48 倍；特斯拉（TSLA.XNAS）暂无财务快照。筛选"涨跌幅 -5%~10%（全库 5527 只）且市值 >100 亿（1842 只）、概念含高股息/破净/半导体/AI（合计 898 只）"共命中 491 只，第 1 页 20 只，榜首中船特气（sh688146），市值 1,586.12 亿。

**要点**：键控免映射；空数组区分"暂无"；筛选把每个条件的命中数回显出来，LLM 能解释"为什么剩 491 只"；原始值与展示值双轨（marketCap 全精度 / marketCapDisplay 千分位）。

## 反例 1：入参堆复杂度

```json
{"symbols": [{"type": "stock", "code": "600000", "market": "SH"}],
 "time": {"start": "2024-01-01", "end": "2024-01-15", "tz": "Asia/Shanghai"},
 "filter": [{"field": "status", "op": "eq", "value": 1}]}
```

**问题**：嵌套对象 + 枚举魔法数 + 筛选组合；而且要求调用方自己拼代码，把消歧复杂度推给 LLM。正确做法：`instruments`、`from`/`to` 平铺标量，不标准输入内部消歧。

## 反例 2：裸 null 与单位缺失

```json
{"code": "600519.XSHG", "trade_date": "2024-01-15",
 "close_price": 7.25, "amount": null, "is_trading": 0}
```

**问题**：`amount` 裸 null（没查到？没披露？休市？）；`close_price` 无单位；`is_trading: 0` 模型会答成"没有交易"。正确做法：字段带单位、空值带 `absence_reason` + message、布尔带 label。

## 反例 3：查询接口越权做消歧

**入参** `instruments: ["BRK"]`，查询接口不直接查 top-1，而是返回候选列表 + `ambiguous: true` + 置信度，让 LLM 追问"你要伯克希尔还是罗马尼亚那家"。

**问题**：越权。消歧结果对不对（BRK 该指向谁）是消歧服务的职责；查询接口只负责用消歧返回的 top-1 代码查数据。候选与歧义处理放回消歧任务解决。

## 反例 4：转写丢关键信息

> 收盘价 7.25 元，涨 1.2%，成交 1.2 亿。

**问题**：丢了代码、日期、精度（`1.2` vs `1.23`）、数据时效；模型无法继续追问、无法判断新旧。正确做法：保留代码/时间/精度/时效（见正例 1）。
