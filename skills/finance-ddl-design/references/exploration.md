# 探索现有库，提取惯例

先搞清楚库长什么样，再决定新表长什么样。探索产出 `conventions.md`，每条惯例必须能追溯到观察。

## 探索纪律

1. **只读。** 只用只读账号和只读语句；探索阶段禁止 DDL/DML。
2. **预算。** 探索前声明行数、扫描量与时间上限；元数据查询也有限制，禁止一次拉全库所有列与注释。
3. **先元数据后抽样。** 先用 catalog/schema 元数据缩小范围，再对少量真实行分层抽样确认口径；`LIMIT` 不等于限制扫描。
4. **观察与推断分开。** 元数据返回什么记 `OBSERVED`；"这个字段大概是复权因子"记 `INFERRED`，写依据与反证条件。

## 探查清单（按顺序，方言按引擎调整）

1. **库与分层**：数据库/schema 清单，表名前缀分布（ods/dwd/dws/ads、dim/fact、tmp 等），判断是否有分层惯例。
2. **表级**：表名、表注释、行数量级、引擎/存储格式、分区键与分区数量、主键/唯一键、索引、外键。
3. **列级**：列名、类型、可空性、默认值、列注释、字符集/排序规则；抽样 3–5 张同域表对比同一语义字段的命名与类型是否一致。
4. **时间列**：哪些列是日期/时间戳，命名后缀（_date/_dt/_ts），是否带时区；分区键与业务日是否同列。
5. **真实行抽样**：每张候选参照表取少量行（限定投影与上限），确认字段口径、单位、代码格式（前导零、大小写）、时区。
6. **历史 DDL**：版本化 DDL 目录、迁移脚本、`SHOW CREATE TABLE`，看注释语言、约束风格、分区习惯的演变。

常用元数据入口（按引擎选）：

- MySQL：`information_schema.tables/columns/statistics`、`SHOW CREATE TABLE`。
- PostgreSQL：`pg_catalog.pg_tables`、`information_schema.columns`、`pg_indexes`、`\d+`。
- ClickHouse：`system.tables/columns/parts`、`SHOW CREATE TABLE`。
- Doris/StarRocks：`information_schema.tables/columns`、`SHOW CREATE TABLE`、`SHOW PARTITIONS`。
- MaxCompute：`information_schema` 受限时用 `SHOW TABLES/COLUMNS` 与表注释。
- DolphinDB：`schema()`、`getTableSchema` 等价接口。

## 关键词检索现有表/字段

不知道"利润表相关的表叫什么"时，用关键词在表名/表描述/字段名/字段描述里模糊检索，快速定位候选表。**这是发现步骤，不是惯例提取**：找到候选后必须继续 `SHOW CREATE TABLE` 与真实行抽样（见上"探查清单"第 5、6 项），口径确认后才进 `conventions.md`。

### MySQL / Doris / StarRocks（information_schema 同构）

```sql
-- 检索目标库中表名/表描述/字段名/字段描述任一包含关键词的表与字段
-- 用法：把 @kw 换成实际词（也可直接写 '利润表' 字面量）；先按 LIMIT 控制返回量
SET @kw = '利润表';
SELECT
    c.TABLE_NAME          AS 表名,
    t.TABLE_COMMENT       AS 表描述,
    c.COLUMN_NAME         AS 字段名,
    c.COLUMN_COMMENT      AS 字段描述,
    c.ORDINAL_POSITION    AS 序号
FROM information_schema.COLUMNS c
JOIN information_schema.TABLES t
  ON t.TABLE_SCHEMA = c.TABLE_SCHEMA
 AND t.TABLE_NAME   = c.TABLE_NAME
WHERE c.TABLE_SCHEMA = 'one_platform'          -- 目标库；写 DATABASE() 表示当前库
  AND (c.TABLE_NAME     LIKE CONCAT('%', @kw, '%')
    OR t.TABLE_COMMENT  LIKE CONCAT('%', @kw, '%')
    OR c.COLUMN_NAME    LIKE CONCAT('%', @kw, '%')
    OR c.COLUMN_COMMENT LIKE CONCAT('%', @kw, '%'))
ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
LIMIT 200;                                     -- 预算：先限行数，按需扩大
```

注意：

- `@kw` 中的 `%`、`_` 会被当作通配符；需要按字面匹配时先 `REPLACE(@kw,'%','\\%')` 并加 `ESCAPE`。
- 该查询会扫描整个 schema 的列元数据，大库通常仍秒级；但结果行数可能很大，**先 `LIMIT`，再按表缩小**。
- 部分客户端不能一次执行 `SET` + `SELECT`，把 `@kw` 换成字面量即可。

### PostgreSQL（pg_catalog）

```sql
SELECT
    c.relname            AS 表名,
    obj_description(c.oid) AS 表描述,
    col.attname          AS 字段名,
    col_description(c.oid, col.attnum) AS 字段描述
FROM pg_class c
JOIN pg_namespace n  ON n.oid = c.relnamespace
JOIN pg_attribute col ON col.attrelid = c.oid
     AND col.attnum > 0 AND NOT col.attisdropped
WHERE n.nspname = 'public'                     -- 目标 schema
  AND (c.relname ILIKE '%利润表%'
    OR col.attname ILIKE '%利润表%'
    OR obj_description(c.oid) ILIKE '%利润表%'
    OR col_description(c.oid, col.attnum) ILIKE '%利润表%')
ORDER BY c.relname, col.attnum
LIMIT 200;
```

### ClickHouse（system.columns）

```sql
SELECT
    c.table AS 表名,
    t.comment AS 表描述,
    c.name  AS 字段名,
    c.comment AS 字段描述
FROM system.columns c
LEFT JOIN system.tables t
  ON t.database = c.database AND t.name = c.table
WHERE c.database = 'default'                   -- 目标库
  AND (c.table ILIKE '%利润表%'
    OR c.name ILIKE '%利润表%'
    OR c.comment ILIKE '%利润表%'
    OR t.comment ILIKE '%利润表%')
ORDER BY c.table, c.position
LIMIT 200;
```

检索结果按"命中关键词的表/字段"分组整理；同一语义字段跨表不同名（如 `code` vs `sec_code`）会同时浮现，正好作为 `naming.md` 同义词裁决的输入。

## 惯例提取模板

对每一条候选惯例，按下列结构记录；多条惯例合并成 `conventions.md`：

```yaml
convention_id: C-001
domain: "表名分层"
observation: "库内 20 张表以 dwd_/dws_ 前缀分层，无 dim_/fact_"
evidence_level: OBSERVED
evidence: "information_schema.tables 全表名前缀计数"
strength: strong   # strong = ≥3 处一致且无冲突；weak = 少于 3 处或存在反例
falsifier: "出现不带前缀的同域表且被业务正常使用"
decision: "新表沿用 dwd_ 前缀；不引入 dim_/fact_"
```

强惯例（strong）优先跟随；弱惯例（weak）只在无冲突时跟随，冲突时问用户。

## 重点提取五类惯例

| 类别 | 提取什么 | 输出到 |
|---|---|---|
| 命名 | 表前缀分层、表名粒度后缀、列名后缀（_id/_cd/_nm/_dt/_amt/_price/_rate/_flag/_status） | naming 裁决输入 |
| 类型 | 金额/价格用 decimal 还是 float、日期用 date 还是 string、代码用 char/varchar 定长还是变长 | types 裁决输入 |
| 键 | 主键单列还是复合、自然键还是代理键、是否自增/UUID、唯一键形态 | types 裁决输入 |
| 时态与分区 | 事件/可得/摄取时间是否分列、分区键、分区粒度、时区惯例 | partitioning 裁决输入 |
| 注释 | 语言、是否含单位与口径、示例值风格、有无"未知 vs 不适用"约定 | 直接写进新 DDL |

## 冲突处理

优先级：**用户明确要求 > 库内强惯例 > 外部规范模板**。每次偏离记录：

- 冲突双方各是什么（惯例原文 vs 规范原文 vs 用户原话）。
- 为什么选这一边。
- 偏离的影响面（下游查询、质检、文档）。

惯例与外部规范冲突且用户未表态时，默认跟随库内强惯例，并在 `design.md` 的待确认清单里列出该冲突。

## 反证检查

- "惯例"只在同域表中一致才成立；跨市场、跨供应商的库可能各有各的惯例，先按域分组再提取。
- 注释与字段名可能过时：真实行抽样与已有查询能推翻注释时，以观察为准，注释口径记 `INFERRED`。
- 测试库与生产库惯例可能不一致：明确当前探索的是哪个库，产出标注范围。
