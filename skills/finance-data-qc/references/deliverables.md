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
    formula: "可复算定义：引用同契约其他字段、声明时间口径与过滤条件，使检查可独立复算核验；原始取数写 '不派生'"
    evidence_level: CONFIRMED
    source: "契约、规范或确认记录的版本化引用"
```

契约只保存已确认且预期跨运行稳定的语义。候选字段映射不要偷偷写成事实；把它放入运行证据并标为 `INFERRED`。市场、标的与覆盖起点未确认时，在契约中显式标注未知，不得默认套用其他市场。

**口径必须可复算：** 每个 `semantics` 条目给 `formula`（对象 + 公式 + 时间口径 + 过滤条件），QC 检查能据此独立复算核验，而不是只读一句散文；无 `formula` 的字段，质检复算只能 `WATCH`。这与 DDL 契约（`finance-ddl-design/references/data-contract.md`）同构。

## `checks/`

**只含过甄别门的检查**（阶段二产出，见 SKILL.md）：高复发 × 高静默成本 × 成本可承受；能对照 `contract.semantics.formula` 复算核验的优先固化。一次性事故、低频可承受、成本不成比例的发现只进报告，不出现在 `checks/`。每个检查定义包含：

- `check_id`：跨运行稳定，建议用缺陷族做前缀，例如 `DUP-PRIMARY-KEY-001`、`MISSING-FIELD-002`、`XTAB-UNIT-001`。
- `rule_version`：规则或查询变化时递增。
- 适用条件和不适用条件，含市场/标的前提。
- 依赖的 `CONFIRMED` 字段语义、市场规范和版本。
- 参数化的数据范围与预算。
- PASS/BLOCK/WATCH 的可验收判据。
- **甄别依据（固化理由）** `triage`：复发风险（会不会再犯，一次性事故不固化）、静默失败成本（再犯且无人发现代价多大）、检测成本（贵则降频/降采样，成本不成比例则放弃）。三问都成立才固化。
- **复算依据** `recalc_ref`：优先引用 `contract.semantics.formula` 的可复算定义，告警可被独立复算验证；无复算依据的写 `null` + "需先补契约"，不静默固化。
- **运行策略**：`schedule`（跟随 `freshness.md` 四种更新制度显式声明：实时/T+1 定点/披露驱动/定期发布；未确认写 `null`，不默认日频）、`threshold`（告警阈值与连续失败次数）、`alert_on`（告警路由：给谁/什么级别）、`depends_on`（数据就绪依赖，如交易日历、上游表就绪）。

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
