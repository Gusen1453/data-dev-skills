# finance-data-qc 两阶段重构实施计划

> **For agents:** 每个文件改动按 Creed 步骤跑 RED→GREEN（文档类任务以 grep 断言为验证手段，不建测试框架）。当前仓库无 tests 目录。

**Goal:** 把 `finance-data-qc` 从扁平"0–8 验收流程"重构为两阶段：阶段一 MECE 探索与试探性检测（覆盖全、不重叠），阶段二甄别固化与策略设计（甄别门三问 + 固化基准可复算 + schedule/阈值/告警/依赖）。

**Architecture:** 只改 `finance-data-qc` 内部（SKILL.md 流程骨架 + deliverables.md 的 checks/ 结构 + defect-catalog.md 第 10 类 + few-shots.md 示例）。阶段一复用 `sampling-statistics.md` 五阶段漏斗、`freshness.md` 四种制度；阶段二新增甄别判据落到 `checks/` 结构。不动其他 skill、不加新层。

**Tech Stack:** Markdown skill 文件；验证用 grep 断言 + 人工检查清单。

## Global Constraints

- 只改 `finance-data-qc` 内部；不做新 skill、不建新层。
- 沿用三级证据纪律（OBSERVED/INFERRED/CONFIRMED → PASS/WATCH/BLOCK）。
- checks 交付原生可执行格式；不携带凭据/敏感样本。
- 中文短句；无模糊不可验收指令。
- 提交：仅用户明确授权后创建 git commit。

---

### Task 1: SKILL.md 两阶段骨架

**Files:**
- Modify: `skills/finance-data-qc/SKILL.md`

**Interfaces:**
- Produces: 两阶段流程骨架 + 路由总览表更新；阶段一 ME 归属纪律；阶段二甄别门与固化基准（供 Task 2/3 引用）

**RED 断言（改动前）：**
- `grep -n "阶段" SKILL.md` → 无"阶段一/阶段二"表达。
- `grep -n "甄别\|固化基准\|互斥归属\|单一归属" SKILL.md` → 无命中。

- [ ] **Step 1: 置换流程骨架** — 路由总览表从"0–8"改为"阶段一 MECE 探索与试探 / 阶段二 甄别固化与策略"；阶段一保持原 0–5（含五阶段漏斗、十类缺陷、场景/横切参考），阶段二新增甄别门与策略设计步骤。
- [ ] **Step 2: 阶段一补 ME 归属纪律** — 在筛缺陷节（原第 5 阶段）补一条：每条观察单一归属一个 check_id；单位错配等双报现场主归一类，另一类注明"由 X 类捕获"。
- [ ] **Step 3: 阶段二新增甄别门 + 固化基准** — 新节"阶段二：甄别固化与策略设计"：三问（复发风险/静默成本/检测成本）、固化基准=契约可复算（对照 `contract.semantics.formula`，无复算依据标注"需先补契约"）、策略层（schedule 跟随 freshness 四种制度、threshold、alert_on、depends_on）。
- [ ] **Step 4: 交付物要求同步** — checks/ 交付物条目注明"只含过甄别门、可复算优先、带运维元数据的检查"。
- **GREEN 断言（改动后）：**
  - `grep -n "阶段一\|阶段二" SKILL.md` → 两处命中（骨架 + 阶段二节）。
  - `grep -n "互斥归属\|单一归属\|甄别\|固化基准\|可复算" SKILL.md` → 命中。
- [ ] **Step 5: 提交**（暂缓，等用户授权）

### Task 2: deliverables.md 的 checks/ 补甄别判据 + 运维元数据

**Files:**
- Modify: `skills/finance-data-qc/references/deliverables.md`

**Interfaces:**
- Consumes: Task 1 阶段二策略层
- Produces: `checks/` 结构含 甄别依据（三问）+ schedule + threshold + alert_on + depends_on + 复算依据（引用 contract.semantics.formula）

**RED 断言（改动前）：**
- `grep -n "schedule\|threshold\|alert_on\|depends_on\|甄别\|复算依据" deliverables.md` → 无命中。

- [ ] **Step 1: 在 `checks/` 节补甄别依据块** — 每个 check 增加：`triage`（复发风险/静默成本/检测成本三问结论）、`recalc_ref`（是否对照 `contract.semantics.formula`；无则写 `null` + "需先补契约"）。
- [ ] **Step 2: 补运维元数据** — `schedule`（跟随 `freshness.md` 四种制度显式声明，未确认写 `null`）、`threshold`（告警阈值）、`alert_on`（路由/级别/连续失败次数）、`depends_on`（数据就绪依赖）。
- [ ] **Step 3: 更新目录说明** — `checks/` 描述注明"只含过甄别门的检查；报告与 checks 分离"。
- **GREEN 断言（改动后）：**
  - `grep -n "triage\|schedule\|threshold\|alert_on\|depends_on\|recalc_ref" deliverables.md` → 命中。
- [ ] **Step 4: 提交**（暂缓，等用户授权）

### Task 3: defect-catalog.md 第 10 类补"甄别门 = 反伪监控"

**Files:**
- Modify: `skills/finance-data-qc/references/defect-catalog.md`

**Interfaces:**
- Consumes: Task 1 甄别门概念
- Produces: 第 10 类"监控缺失"含"任何发现都固化 = 伪监控；只有过甄别门的固化"

**RED 断言（改动前）：**
- `grep -n "甄别门\|伪监控\|任意发现\|全部固化" defect-catalog.md` → 无命中。

- [ ] **Step 1: 在第 10 类补制度** — 加"缺甄别门 = 伪监控"：不是任何发现都固化为常驻校验；一次性事故只进报告、周期复发的高复发×高静默×可承受才固化；固化后带 schedule/阈值/告警路由。
- [ ] **Step 2: 补反证路径** — "哪些发现不该固化"（一次性、低频可承受、成本不成比例）写进"如何反证/何时不能下结论"。
- **GREEN 断言（改动后）：**
  - `grep -n "甄别门\|伪监控" defect-catalog.md` → 命中。
- [ ] **Step 3: 提交**（暂缓，等用户授权）

### Task 4: few-shots.md 示例升级

**Files:**
- Modify: `skills/finance-data-qc/examples/few-shots.md`

**Interfaces:**
- Consumes: Task 1/2 甄别门 + 策略元数据
- Produces: 例 2 固化标准升级；新增"一次性事故不固化"反例；例 5 监控缺陷补告警路由

**RED 断言（改动前）：**
- `grep -n "甄别\|schedule\|告警路由\|triage" few-shots.md` → 无命中。

- [ ] **Step 1: 升级例 2** — "该检查应落为常驻校验"改为"过甄别门（T+1 高复发 × 静默成本高）后固化，schedule=T+1 制度、阈值、告警路由"。
- [ ] **Step 2: 新增反例** — "一次性迁移事故也被固化成常驻检查" → 僵尸清单；正解只进报告不固化。
- [ ] **Step 3: 补例 5** — 孤立空值的监控缺陷 BLOCK 补"告警路由（孤立空值告警到人，不静默）+ 接口区分无数据/为零"。
- **GREEN 断言（改动后）：**
  - `grep -n "甄别门\|schedule\|告警路由\|只进报告" few-shots.md` → 命中。
- [ ] **Step 4: 提交**（暂缓，等用户授权）

### Task 5: 收口验证

**Files:**
- 无新增；跑断言覆盖全 Task。

**Interfaces:**
- Consumes: Task 1–4 全部产物
- Produces: 全量断言通过 + 检查清单

- [ ] **Step 1: 全量 RED→GREEN 重跑** — 三处 SKILL/deliverables/defect-catalog/few-shots 的 grep 断言全部命中。
- [ ] **Step 2: 一致性检查** — 修复前 few-shots 例 2 的"应落为常驻校验"旧措辞已升级；无两阶段前后矛盾表述；无新增 skill/README 改动（本轮不该碰）。
- [ ] **Step 3: 提交**（暂缓，等用户授权）