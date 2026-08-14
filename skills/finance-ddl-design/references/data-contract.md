# 数据契约交付

契约是建表交付与质检验收之间的桥梁：`finance-data-qc` 验收时把契约里的字段语义当作 `CONFIRMED` 口径来源，契约含糊 = 质检只能给 WATCH。结构对齐 [Open Data Contract Standard](https://github.com/bitol-io/open-data-contract-standard)（ODCS）的 `name/schema/quality/owner` 骨架，但保持精简，并与 `finance-data-qc/references/deliverables.md` 的 `contract.yaml` 同构。

## `contract.yaml` 结构

```yaml
contract_version: "1.0.0"
dataset_id: vendor.market_dataset
name: dwd_market_daily_bar
owner:
  team: "数据组"
  contact: "data-team@example.com"
purpose: "已确认的消费用途"
engine:
  kind: "mysql"          # 用户提供的实际引擎
  version: "8.0"
keys:
  entity: ["sec_code"]
  event_time: "trade_date"
  availability_time: "ann_date | null"
market_scope: ["CN"]
instrument_types: ["stock"]
timezone: "Asia/Shanghai"
frequency: "daily"
coverage_start: "2010-01-01 | null"
freshness_policy: "T+1 定点 | null"
schema:
  - field: sec_code
    type: varchar(10)
    nullable: false
    description: "证券代码，6 位数字保留前导零；单位：无；来源：交易所"
    enum: null
    unit: null
    format: "000001"
  - field: trade_date
    type: date
    nullable: false
    description: "交易日，按交易所日历"
    unit: null
    format: "YYYY-MM-DD"
  - field: adj_factor
    type: decimal(20,8)
    nullable: true
    description: "后复权因子；NULL 表示当日无除权记录"
    unit: null
    format: null
semantics:
  - field: adj_factor
    meaning: "后复权累计因子，前复权 = 后复权 / 最新因子"
    evidence_level: CONFIRMED
    source: "contract v1.0.0 评审记录 / 供应商文档 v2"
  - field: close_price
    meaning: "收盘价，未复权，单位元"
    evidence_level: CONFIRMED
    source: "contract v1.0.0 评审记录"
```

规则：

- `schema` 里每个字段与 DDL 列一一对应；`description` 与 DDL 列注释同文。
- `semantics` 只写 `CONFIRMED` 语义；推断口径放 `design.md` 并标 `INFERRED`，**不得写进契约冒充事实**。
- 未知项显式写 `null`（如 `coverage_start: null`），不默认套用其他市场。
- 时间字段的 `format` 写 `YYYY-MM-DD` / `YYYY-MM-DD HH:MM:SS+08:00`；时区在顶层 `timezone` 声明，事件时间另有原始时区的在字段描述注明。

## 变更管理

- `contract_version` 语义化版本；破坏性变更（改类型、改口径、删字段）升主版本，兼容新增升次版本。
- 变更先评审：列出受影响下游查询、质检 check、文档；评审记录进 `design.md` 或契约文件头注释。
- DDL 与契约**同步更新**：列注释、`schema.description`、`semantics.meaning` 三处不一致 = 契约失效。

## 与质检的衔接

- `finance-data-qc` 的 `contract.yaml` 可直接复用本契约；质检 check 依赖 `semantics` 里的 `CONFIRMED` 口径与 `source`。
- 契约覆盖不到的字段，质检只能给 `WATCH`——所以建表时把口径写清，是给后续质检省钱。
