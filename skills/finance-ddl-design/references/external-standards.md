# 外部规范参考

本 skill 的规则来源：**库内惯例优先，外部规范做对照**。探索结果与外部规范冲突时，按 `exploration.md` 的优先级裁决（用户明确要求 > 库内强惯例 > 外部规范）。以下规范只提供通用原则与要点，不提供可照抄的万能模板；写 DDL 前仍须按库内惯例与用户确认。

## SQL 风格与命名

- **[SQL style guide（Simon Holywell）](https://www.sqlstyle.guide/)**（[中文版](https://www.sqlstyle.guide/zh/)）：标识符统一小写蛇形、不用保留字、命名与注释纪律。本 skill 的 `naming.md` 通用规则取自其原则，并按投研域扩展后缀表。
- **数仓分层命名**：阿里云数仓分层（[DataWorks 分层架构规范](https://help.aliyun.com/zh/dataworks/user-guide/data-layer-1)、[MaxCompute 数仓分层](https://www.alibabacloud.com/help/zh/maxcompute/getting-started/divide-a-data-warehouse-into-layers)、[数仓建模规范思考](https://developer.aliyun.com/article/1645530)）：ODS/DWD/DWS/ADS 分层与命名规范。本 skill 的 `naming.md` 表名前缀表取自该体系。

## 数据契约

- **[Open Data Contract Standard（bitol-io）](https://github.com/bitol-io/open-data-contract-standard)**：[完整示例](https://bitol-io.github.io/open-data-contract-standard/latest/examples/all/full-example/)给出 `name/schema/quality/owner` 等字段结构。本 skill 的 `data-contract.md` 对齐其骨架但保持精简。
- **[Data Contract Specification（TFMV）](https://github.com/TFMV/datacontract-specification)**：另一套契约规范，含数据质量断言与 example 校验；需要更严格的机器校验时参考。

## 投研数据建模

- **[qlib PIT 设计](https://github.com/zjuchi/qlib/blob/2e9a00a9/docs/advanced/PIT.rst#L90-L140)**：Point-in-Time 数据设计——财务数据必须按"当时可见"组织，`end_date` 与披露时间分离。本 skill 的 `partitioning.md` 三列时态与 `investment-research.md` 财务节取自该思路。
- **[DolphinDB 复权因子与复权行情计算](https://docs.dolphindb.com/zh/tutorials/market_condition_adjustments.html)**：后复权/前复权/不复权的口径与因子计算。本 skill 的行情节规定"原始价 + 复权因子分离"，避免前复权覆盖历史。
- **[股票行情表设计示例（开源投研数据湖 schema）](https://github.com/rootSunc/ashare-lake/blob/main/docs/datasets/schema.md)**、[bigquant 数据源字典（如 cn_stock_bar1d）](https://capture.bigquant.com/data/datasources/cn_stock_bar1d)：真实投研行情表的字段习惯参考，注意只作观察、跟随库内惯例。

## 其他 agent skill（同类参考）

- [db-schema-designer（inbharatai/claude-skills）](https://github.com/inbharatai/claude-skills/blob/main/skills/db-schema-designer/SKILL.md)、[database-designer（alirezarezvani/claude-skills）](https://github.com/alirezarezvani/claude-skills/blob/main/engineering/skills/database-designer/SKILL.md)、[discover-database（rand/cc-polymath）](https://github.com/rand/cc-polymath/blob/HEAD/skills/discover-database/SKILL.md)：通用 schema 设计/发现类 skill，可对照它们的流程；本 skill 的差异点是**先探索惯例再建表**、投研域口径（复权、PIT、单位时区）与契约交付。
- [Atlas 的 schema 迁移 agent skill](https://atlasgo.io/guides/ai-tools/agent-skills)：迁移式 DDL 与版本管理的工程化参考。

## 使用方式

- 冲突时引用具体规范条文（带链接与要点），不引用"网上说"。
- 外部规范更新：本文件只是索引，规则要点已在各 reference 内固化；发现规范过期时更新本文件链接与要点。
