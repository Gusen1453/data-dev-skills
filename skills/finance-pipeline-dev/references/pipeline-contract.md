# 管道契约与交付

管道契约是 DDL 契约与质检之间的衔接件：目标表结构来自 `finance-ddl-design` 的 `contract.yaml`，更新制度与 SLA 是 `finance-data-qc` freshness 检查的 `CONFIRMED` 前提。三段契约（表结构、管道、质检）必须互相对得上。

## `pipeline.yaml` 结构

```yaml
pipeline_version: "1.0.0"
pipeline_id: load_cn_stock_daily_bar
source:
  kind: "上游表"                 # 表/API/文件/CDC
  ref: "ods_vendor_daily_bar"
target:
  table: "dwd_cn_stock_daily_bar"
  contract_ref: "contract.yaml#dwd_cn_stock_daily_bar"   # 引用 DDL 契约
update_regime: "T+1 定点"        # 对齐 QC 四种制度，未确认写 null
frequency: "daily 18:30 Asia/Shanghai"
increment:
  strategy: "time_watermark"
  watermark_field: "ingest_ts"
  late_window: "3 days"          # 晚到容忍，来自用户确认，不硬编码
idempotency:
  strategy: "partition_overwrite"
  dedup_key: ["sec_code", "trade_date"]
backfill:
  window_param: "--from/--to"
  parallel: "per-partition"
  upstream_ready_check: true
rerun:
  retry: "3, exp backoff"
  recovery: "resume_from_failed_partition"
  reconciliation: ["row_count", "unique_key", "amount_check"]
sla:
  availability: "T+1 08:00 Asia/Shanghai"
  alert_on: ["failure", "delay_gt_30min", "reconcile_mismatch"]
dependencies: ["ods_load", "trade_calendar_ready"]
```

规则：

- `contract_ref` 指向 DDL 产出的 `contract.yaml`；目标表键、分区、时态列以契约为准，不重复定义。
- `update_regime` 只用 QC 四种制度之一；未确认显式 `null`，不默认套其他市场。
- 幂等与对账是默认项；无法满足时显式声明风险与补救。
- 变更管理：增量方式、去重键、晚到窗口变化 = 破坏性变更，先评审下游查询与 QC check 再改。

## 交付目录（套件级）

```text
<project-id>/
├── contract.yaml            # finance-ddl-design 产出：表结构契约
├── design.md                # finance-ddl-design 产出：设计说明
├── pipelines/               # finance-pipeline-dev 产出
│   ├── pipeline.yaml
│   ├── load_cn_stock_daily_bar.sql   # 或 .py / DAG 配置
│   └── backfill_cn_stock_daily_bar.sql
├── checks/                  # finance-data-qc 产出：监测脚本
└── runs/<run-id>/           # finance-data-qc 产出：运行证据
    ├── evidence.json
    └── report.md
```

同一 `contract.yaml` 被 DDL、管道、质检三方引用；改动走契约版本管理（见 `finance-ddl-design/references/data-contract.md`）。

## 与 QC 的衔接点

- 更新制度、晚到窗口、应到未到窗口 → freshness 检查的判定前提。
- 链路时间戳（业务发生 → 上游可得 → 采集 → 加工 → 可见）→ freshness 链路分段的数据来源，管道应保留各段时间戳。
- 对账项与 QC check 复用同一套键与口径，避免"管道说没丢、QC 说丢了"。
