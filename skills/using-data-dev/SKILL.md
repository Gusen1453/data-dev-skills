---
name: using-data-dev
description: >-
  Routes data engineering and governance work by responsibility. Use when a
  request concerns 数据契约、DDL、管道开发、质量验收、查询接口、数据治理或合规，
  or when the correct data-dev skill is unclear. Routes financial research-library
  DDL design work to finance-ddl-design, pipeline work to finance-pipeline-dev,
  query interface work to finance-query-contract and quality work to
  finance-data-qc; does not connect to data sources or execute the work itself.
---

# 数据开发任务路由

## MUST

1. 只路由，不连接数据源、不执行查询、不生成业务交付物。
2. 只选择当前仓库真实提供的 skill；未安装的能力必须明确说明不可用。
3. 一次选择一个主责任。跨领域任务先确认当前要交付的结果，再处理后续责任。

## 责任分类

- **数据契约 / DDL**：schema、主键、类型、命名、分区和兼容性设计。
  - 投研研究库的建表/改表与 DDL 设计 → **finance-ddl-design**，它直接执行，不再往下路由。
  - 其他数据集 → 当前尚未提供专用执行 skill。
- **管道开发**：增量、幂等、回补、重跑和故障恢复。
  - 投研研究库的管道设计/排障 → **finance-pipeline-dev**，它直接执行，不再往下路由。
  - 其他数据集 → 当前尚未提供专用执行 skill。
- **质量验收**：证明数据是否满足可追溯规则。
  - 金融投研研究库（行情、财务、公告事件、主数据、指数基金、宏观行业）→ **finance-data-qc**，它直接执行验收，不再往下路由。
  - 其他数据集 → 当前尚未提供专用执行 skill。
- **查询接口**：视图/API 查询契约、过滤分页、时态和性能预算。
  - 投研研究库的查询接口设计/排障 → **finance-query-contract**，它直接执行，不再往下路由。
  - 其他数据集 → 当前尚未提供专用执行 skill。
- **数据治理**：目录、血缘、责任人、SLA 和生命周期。当前尚未提供执行 skill。
- **合规**：分类、最小权限、脱敏、导出、保留和审计。当前尚未提供执行 skill。

## 路由步骤

1. 用用户期望的最终交付物判断主责任，不按数据库或工具名称分类。
2. 若主责任是投研研究库的建表/DDL 设计，读取并执行 **finance-ddl-design**。
3. 若主责任是投研研究库的管道设计/排障，读取并执行 **finance-pipeline-dev**。
4. 若主责任是投研研究库的查询接口设计/排障，读取并执行 **finance-query-contract**。
5. 若主责任是金融投研质量验收，读取并执行 **finance-data-qc**。
6. 若目标 skill 未安装，说明缺少的能力；不要用相邻 skill 冒充。
7. 若一个请求包含多个责任，只询问一个会改变主责任的聚焦问题。

## STOP

- 无法判断用户要的是“设计、开发、验收、服务、治理还是合规结论”。
- 目标能力尚未提供。
- 需要通过连接数据库才能完成路由判断。
