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

```text
finance-data-qc/<dataset-id>/
  contract.yaml
  checks/                     # 非 SQL 数据源使用原生可执行格式
  runs/<run-id>/
    evidence.json
    report.md
```

每次运行保存独立证据，不覆盖历史结果。示例均位于对应 skill 内。

## License

MIT
