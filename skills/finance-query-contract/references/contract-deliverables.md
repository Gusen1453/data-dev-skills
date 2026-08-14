# 接口契约与交付

接口契约把查询面、入参、出参、空值口径、性能预算固化成可验收的定义，并作为 `finance-data-qc`"接口层"缺陷检查的 `CONFIRMED` 依据。字段语义必须追溯到 DDL 产出的 `contract.yaml`。

## `api-contract.yaml` 结构

```yaml
api_version: "1.0.0"
dataset_id: vendor.market_dataset
queries:
  - query_id: quote_daily
    purpose: "单标的多字段日行情"
    consumer: "AI tool / 分析师"
    source:
      table: "dwd_cn_stock_daily_bar"
      contract_ref: "contract.yaml#dwd_cn_stock_daily_bar"
    input:
      - name: instruments
        type: "string | string[]"
        required: true
        max_items: 50
        note: "接受标准代码/裸代码/名称/别名，接口内部消歧"
      - name: trade_date
        type: "date"
        required: true
      - name: fields
        type: "string[]"
        required: false
        default: "close_price,chg_rate,turnover_amt"
    output:
      schema:
        - field: code
          type: string
          note: "标准化代码 MARKET.CODE，如 600000.SH"
        - field: close_price
          type: decimal
          unit: "元"
          absence: ["NO_DATA", "NOT_APPLICABLE"]
      as_of: true
      source: true
    absence_policy:
      NOT_FOUND: "未查到该标的"
      NO_DATA: "数据暂无（尚未披露）"
      NON_TRADING: "非交易日（休市）"
      NOT_APPLICABLE: "不适用（指数/基金等无该指标）"
      NULL: "未知（上游缺失，待确认口径）"
    pagination:
      page_size_max: 1000
    performance:
      timeout_ms: 3000
      scan_bound: "单分区，时间范围必填"
    text_rendering: "rules per references/json-to-text.md"
```

规则：

- `query_id` 稳定；入参/出参/空值口径变化 = 契约版本变更。
- `contract_ref` 指向 DDL 契约；字段单位、枚举、时区以契约为准，不重复定义。
- `absence_policy` 五个口径必须有中文 message；接口实现与转写层共用同一份。
- 未知项显式 `null` 或注明"待确认"，不默认套用其他市场。

## 与套件的衔接

- **DDL 契约**：字段语义、键、分区、时区来自 `finance-ddl-design` 的 `contract.yaml`；接口不发明新口径。
- **管道**：`as_of`/时效声明对应 `finance-pipeline-dev` 的 `pipeline.yaml` 的 SLA；缓存刷新时点与管道完成时点一致。
- **质检**：QC 的"接口层"缺陷族（传参 20 返 15、字段歧义、空值混乱、失效标的被捞出、超时）以本契约为 `CONFIRMED` 依据：`query_id` 对应 check 的接口范围，`absence_policy` 是空值检查的判定前提。

## 交付目录（套件级）

```text
<project-id>/
├── contract.yaml            # finance-ddl-design：表结构契约
├── design.md
├── pipelines/               # finance-pipeline-dev
│   └── pipeline.yaml
├── api/                     # finance-query-contract
│   ├── api-contract.yaml
│   ├── api-spec.md
│   └── examples/            # 入参/出参 + json→str 对照
├── checks/                  # finance-data-qc
└── runs/<run-id>/
```

## 变更管理

- 入参增删、出参改名、空值口径变化 = 破坏性变更：先评审下游调用方（LLM 工具描述、分析师脚本）与 QC check。
- 新增字段、新增查询 = 兼容变更，升次版本。
- api-contract.yaml 与 api-spec.md 同步更新，禁止"契约写了接口没实现"或反之。
