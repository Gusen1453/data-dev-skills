# 版本化证据包

把稳定定义与每次运行的事实分开。建议目录：

```text
finance-data-qc/
├── contract.yaml
├── checks/
│   ├── DUP-PRIMARY-KEY-001.sql
│   ├── FRESHNESS-ARRIVAL-001.sql
│   └── PIT-VISIBILITY-001.py
└── runs/
    └── 2026-08-13T083000Z__snapshot-42/
        ├── evidence.json
        └── report.md
```

`contract.yaml` 和 `checks/` 是数据集级稳定定义。`runs/<run_id>/` 是运行级证据。每次运行创建新目录；历史运行不可覆盖、原地改写或用单个 latest 报告替换。

## `contract.yaml`

至少记录：

```yaml
contract_version: "1.0.0"
dataset_id: vendor.market_dataset
purpose: "已确认的消费用途"
engine:
  kind: "用户提供的实际引擎或格式"
  version: "执行时版本"
keys:
  entity: ["已确认的证券键"]
  event_time: "已确认的事件时间"
  availability_time: "已确认时填写；未知则显式为 null"
market_scope: ["已确认市场"]
instrument_types: ["已确认标的类型，如股票/指数/基金净值/外汇"]
timezone: "已确认时区；未知则显式为 null"
frequency: "已确认频率；未知则显式为 null"
coverage_start: "已确认覆盖起点；未知则显式为 null"
freshness_policy: "已确认实时/T+1/披露制度；未知则显式为 null"
semantics:
  - field: "字段"
    meaning: "口径"
    evidence_level: CONFIRMED
    source: "契约、规范或确认记录的版本化引用"
```

契约只保存已确认且预期跨运行稳定的语义。候选字段映射不要偷偷写成事实；把它放入运行证据并标为 `INFERRED`。市场、标的与覆盖起点未确认时，在契约中显式标注未知，不得默认套用其他市场。

## `checks/`

每个检查定义包含：

- `check_id`：跨运行稳定，建议用缺陷族做前缀，例如 `DUP-PRIMARY-KEY-001`、`MISSING-FIELD-002`、`XTAB-UNIT-001`。
- `rule_version`：规则或查询变化时递增。
- 适用条件和不适用条件，含市场/标的前提。
- 依赖的 `CONFIRMED` 字段语义、市场规范和版本。
- 参数化的数据范围与预算。
- PASS/BLOCK/WATCH 的可验收判据。

SQL 数据源保存真实方言的 `.sql`；非 SQL 检查保存原生可执行格式。非 SQL 内容不得为了目录一致而伪装成 `.sql`。检查文件不得包含主机凭据、私钥、令牌或未脱敏样本。

## `runs/<run_id>/evidence.json`

`evidence.json` 是机器可读运行事实，最小结构：

```json
{
  "run_id": "2026-08-13T083000Z__snapshot-42",
  "contract_version": "1.0.0",
  "engine": {"kind": "actual-engine", "version": "actual-version"},
  "started_at": "2026-08-13T08:30:00Z",
  "budget": {"rows": 50000, "seconds": 60, "scan_bytes": 104857600},
  "data_range": {
    "markets": ["DEMO"],
    "instrument_types": ["equity"],
    "entities": "脱敏集合或过滤器摘要",
    "event_time": {"from": "2026-08-01", "to": "2026-08-08"},
    "coverage_start": "2020-01-01"
  },
  "snapshot": {"kind": "snapshot/version/manifest", "id": "42"},
  "checks": [
    {
      "check_id": "DUP-PRIMARY-KEY-001",
      "rule_version": "1.0.0",
      "executable": "checks/DUP-PRIMARY-KEY-001.sql",
      "parameters": {"market": "DEMO"},
      "observed": {"rows_tested": 1200, "violations": 0},
      "evidence_level": "CONFIRMED",
      "decision": "PASS",
      "evidence_refs": ["contract.yaml#timezone", "query-result-sha256:..."]
    }
  ]
}
```

示例数值只说明字段形状，不是查询预算或质量阈值。实际预算由本次任务批准并写入证据。

每项检查必须同时保留 `check_id`、`rule_version`、`data_range` 或对顶层范围的引用、`snapshot` 或对顶层快照的引用、观察结果、`evidence_level`、结论及证据引用。未执行检查使用明确状态，不写成零违规。

## `runs/<run_id>/report.md`

报告供人阅读，至少包含：

1. 数据集、契约版本、引擎、市场/标的前提、数据范围、覆盖起点和快照。
2. 查询预算、实际消耗、降级或 STOP 事件。
3. PASS、BLOCK、WATCH 摘要。
4. 每个 `check_id` 的规则版本、观察、证据等级、结论和可重跑文件。
5. `INFERRED` 假设的依据、置信度、反证条件和待补证据。
6. 时效与覆盖相关观察：实时/T+1、应到未到、覆盖起点。
7. 与上一运行差异；若无法比较，写明原因。

报告只解释证据，不取代 `evidence.json` 或可执行检查。
