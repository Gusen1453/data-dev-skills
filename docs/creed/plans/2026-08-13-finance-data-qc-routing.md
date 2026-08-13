# 投研数据质检合并为单执行器实施计划

> **执行要求：** TDD + test-design。未经用户明确授权，不创建 git commit。

**目标：** 仓库只保留 `using-data-dev`（路由）与 `finance-data-qc`（执行器）；质检规则按通用缺陷族组织，场景差异下沉到 references。

**架构：** `using-data-dev` → `finance-data-qc`（直接执行，不再往下路由）。

## 全局约束

- 只列真实 skill；不连接数据源。
- 根目录无 skill 私有 `examples/` / `scripts/`。
- 中文短句；无模糊不可验收指令。
- 真实案例必须脱敏：不含人名、内部库表与字段名。

---

### 任务 1：执行器契约测试 — 已完成

**文件：**
- 新增：`tests/finance-data-qc.test.mjs`
- 修改：`tests/repository-contract.test.mjs`

- [x] RED：断言十类缺陷族、跨表与时效参考、脱敏事故库、四份场景参考、结论权限、仓库只剩两个 skill。9 项失败。
- [x] GREEN：见任务 2、3。
- [x] 提交：暂缓。

### 任务 2：重建 finance-data-qc 执行器 — 已完成

**文件：**
- 重写：`skills/finance-data-qc/SKILL.md`
- 新增：`references/defect-catalog.md`、`cross-table-consistency.md`、`freshness.md`、`real-world-cases.md`
- 新增：`references/market-reference.md`、`fundamental-valuation.md`、`disclosure-event.md`、`macro-industry.md`
- 复用：`references/exploration.md`、`engine-adapters.md`、`deliverables.md`
- 新增：`examples/few-shots.md`

- [x] GREEN：十类缺陷族含检测手法、反证路径、不能下结论的条件；场景参考只写判定前提。
- [x] 提交：暂缓。

### 任务 3：下线四个场景 skill 与文档收口 — 已完成

**文件：**
- 删除：`skills/finance-{market-reference,fundamental-valuation,disclosure-event,macro-industry}-qc/`
- 删除：对应 `tests/*.test.mjs`、`tests/evals/*.json`、`docs/creed/plans/*.md`
- 修改：`skills/using-data-dev/SKILL.md`、`README.md`、`tests/evals/finance-data-qc.json`
- 修改：`docs/creed/specs/2026-08-13-finance-data-qc-design.md`

- [x] GREEN：全量 19 项测试通过。
- [x] 提交：暂缓。

## 遗留

- 尚未在真实数据源上跑过一次完整验收，`evidence.json` 与 `report.md` 的实际形态未经检验。
- eval 场景仅为期望描述，未接入自动评分。
