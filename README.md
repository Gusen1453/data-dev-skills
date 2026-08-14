# data-dev-skills

面向金融投研数据开发与治理的 Agent Skills 仓库，可通过 skills registry 安装。

## 安装

```bash
npx skills add Gusen1453/data-dev-skills
```

## 已提供的 Skills

| Skill | 责任 |
|---|---|
| **using-data-dev** | 按数据契约、管道、质量、查询接口、治理、合规等工程责任路由 |
| **finance-ddl-design** | 投研建表与 DDL 设计执行器：先探索现有库提取命名/类型/键/分区惯例，再产出带注释与约束的可执行 DDL、设计说明与数据契约 |
| **finance-pipeline-dev** | 投研数据管道执行器：增量同步、幂等写入、参数化回补、重跑与故障恢复、调度依赖与 SLA，产出管道脚本与管道契约 |
| **finance-query-contract** | 投研查询接口执行器（面向 AI LLM 工具与分析师）：入参简单、分页/筛选/批量、标的消歧与标准化代码、单位与空值分口径、json 转一段话的可读化转写，产出接口契约与规格 |
| **finance-data-qc** | 投研数据质检执行器：重复、缺失、断档、错值、滞后、单位与命名不统一、注释歧义、维度污染、接口截断 |

不确定使用哪个 skill 时，从 **using-data-dev** 开始。

## 设计原则

- 主用户是券商/基金买方卖方的分析师、研究员，以及给他们供数的人。
- 路由器只选择责任，不连接数据源、不执行检查。
- 质检按**通用缺陷族**组织，行情、财务、公告、宏观的差异只作为判定前提放进 `references/`，不按场景拆 skill。
- 多市场、多类型标的通过适配表处理，不按市场拆 skill。
- 跨表一致性、时效覆盖、真实事故库各有一份统一参考，避免同样的规则抄在多处。
- 证据分为 `OBSERVED`、`INFERRED`、`CONFIRMED`；仅推断只能产生 `WATCH`。
- 组合持仓运营与交易账本不在范围内。

## 业务项目交付物

同一数据集的交付物由流水线 skill 协作产出，共用一份 `contract.yaml`：

```text
<dataset-id>/
  contract.yaml              # finance-ddl-design：表结构契约（键/分区/时态/语义）
  design.md                  # finance-ddl-design：设计说明
  conventions.md             # finance-ddl-design：探索出的库内惯例
  pipelines/                 # finance-pipeline-dev：增量/回补/重跑脚本与 pipeline.yaml
  api/                       # finance-query-contract：接口契约、规格与 json→str 转写示例
  checks/                    # finance-data-qc：监测脚本（非 SQL 数据源使用原生可执行格式）
  runs/<run-id>/             # finance-data-qc：每次运行独立证据
    evidence.json
    report.md
```

每次运行保存独立证据，不覆盖历史结果。示例均位于对应 skill 内。

## License

MIT
