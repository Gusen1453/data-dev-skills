# 引擎适配

引擎只改变元数据读取、采样、限额和检查语法，不改变证据等级、结论权限、缺陷族或 STOP 条件。先用用户明确提供的连接类型和版本；无法识别时询问，不猜测方言。

检查一律用该引擎的**原生可执行格式**保存（`.sql` / `.dsl.json` / `.js` / `.py` 等），不得把非 SQL 检查伪装成 `.sql`。

## 通用适配步骤

1. **识别能力。** 确认引擎、版本、只读机制、取消方式、扫描量/调用次数估算、分页与超时行为、时间类型与时区。
2. **读取元数据。** 优先用 catalog、mapping、collection schema、system 表或引擎自带描述 API，不先扫业务数据。
3. **限制采样。** 下推投影、分区/分片、时间与实体谓词；设置结果行数、扫描字节、执行时间或 API 调用上限。
4. **保存原文。** 保存实际可执行请求、参数、引擎版本、索引/集合名与会话时区，不只保存自然语言摘要。
5. **核对行为。** 验证分页、采样、近似聚合、NULL/缺失字段、数值精度、时区与标识符引用是否符合该引擎语义。

通用的五阶段漏斗、稳定哈希抽样、时间窗口、风险定向样本、统计项与全表检查门槛见 `sampling-statistics.md`。本文件只补充各引擎如何安全实现这些动作。

---

## SQL 关系库与数仓

SQL 检查必须是对应方言可重跑的 SQL：

- **PostgreSQL / MySQL / MariaDB**：`information_schema` 或系统 catalog；投影 + 分区/索引谓词 + 参数 + 服务端超时。
- **ClickHouse**：先读 `system.tables` / `system.columns`、分区与主键；`SAMPLE` 是否由表键支持要核对，无效抽样不能当代表样本。
- **BigQuery / Snowflake 等仓库**：执行前 dry run 或扫描估算；设 bytes / warehouse / time 限额并限定分区。
- **DuckDB / SQLite**：确认文件路径、附加库与只读选项；大文件先看格式元数据与分区布局。

```sql
SELECT <explicit_columns>
FROM <quoted_relation>
WHERE <time_partition_predicate>
  AND <entity_predicate>
ORDER BY <stable_keys>
LIMIT <approved_row_limit>;
```

尖括号占位符不得作为已执行证据。

---

## Elasticsearch / OpenSearch

投研常见用途：公告全文、研报检索、选股筛选、日志与到达时延排查。

**元数据先读**

- `_cat/indices`、index settings、mappings（字段类型、analyzer、nested/object）。
- 确认时间字段是 `date` 还是 keyword/string；确认主键字段（`_id` 或业务 id）是否稳定。

**查询边界**

- 所有检索必须带 `size` / `terminate_after` / 时间范围或实体 filter；禁止无过滤的 match_all 全扫。
- 深分页用 `search_after` 或 PIT（point-in-time），不要靠超大 `from+size`。
- 聚合检查用 `composite` 或带 `size` 上限的 terms；注意 `doc_count_error_upper_bound` 与近似性，近似结果只能当线索。
- 调用次数与返回字节计入查询预算。

**缺陷族落地提示**

| 缺陷族 | 在 ES 上怎么查 |
|---|---|
| 主键重复 | 按业务 id 做 `terms`/`composite` 聚合，找 `doc_count > 1`；或 `_id` 与业务键不一致的样本 |
| 缺失 | `exists` / `must_not exists` 统计空字段率；nested 字段要进 nested query |
| 连续性 | 按日 `date_histogram` + 实体 filter，看桶内 doc_count 分布 |
| 数值错误 | `stats`/`percentiles` 看量级；跨字段用 script 或导出后复算 |
| 时效 | 对 `@timestamp` / 入库时间与业务时间做延迟直方图 |
| 接口层 | 对比请求实体数与 hits 覆盖；核对默认 `size=10` 导致的静默截断 |

**保存格式**：可重跑的 Query DSL JSON（或等价请求脚本），附 index 名、PIT id（若用）、引擎版本。

---

## MongoDB

投研常见用途：研报/公告结构化文档、灵活 schema 的主数据与事件库。

**元数据先读**

- `listCollections`、`collStats`、索引列表、validator（若有）。
- 抽样若干文档看实际字段集合；Mongo 无强制 schema，**字段出现与否本身就是观察对象**。

**查询边界**

- 一律带 filter + `limit`；大集合先用索引字段缩小范围，再用 `$sample` 或有界游标。
- 禁止无过滤的全表 `find({})`；`allowDiskUse` 与扫描量要进预算。
- 聚合管道每步评估文档膨胀；`$lookup` 前确认两边过滤已下推。

**缺陷族落地提示**

| 缺陷族 | 在 Mongo 上怎么查 |
|---|---|
| 主键重复 | 对业务键 `$group` + `$match: { count: { $gt: 1 } }`；区分 `_id` 唯一与业务键唯一 |
| 缺失 | `$project` 后统计字段不存在 vs 值为 null；二者要分开报 |
| 连续性 | 按实体 + 日桶 `$group` 计数，找月均个位数的实体 |
| 数值错误 | `$group` 求 min/max；嵌套路径用点号取值 |
| 命名与单位 | 同集合不同文档字段名漂移、同义路径并存（如 `mktCap` vs `market_cap`） |
| 注释口径 | 依赖字段旁注释文档或上游契约；集合内自描述不可靠 |

**保存格式**：可重跑的 `find`/`aggregate` 管道 JSON 或驱动脚本，附 database、collection、读偏好（必须 secondary/readonly 若可行）。

---

## 时序数据库

覆盖 **InfluxDB、TimescaleDB、TDengine、QuestDB、OpenTSDB、VictoriaMetrics** 等。投研常见用途：行情 tick/分钟线、宏观高频、监控指标。

**元数据先读**

- 测点/metric 清单、tag 键、field 键、retention policy / 保留时长、分片或 hypertable 分区键。
- 确认时间精度（秒/毫秒/纳秒）与存储时区；确认同一测点是一行多 field 还是多 series。

**查询边界**

- 强制时间窗 + 实体/测点过滤；禁止无时间谓词的全历史扫描。
- 降采样（`GROUP BY time` / `time_bucket` / `SAMPLE BY`）结果要标注为近似，不能冒充原始 tick 证据。
- 写依赖：只读账号；禁止 `DELETE`/`DROP`/`ALTER RETENTION`。

**缺陷族落地提示**

| 缺陷族 | 在时序库上怎么查 |
|---|---|
| 连续性 | 按实体 × 时间桶计数；比对交易日历应有点数；看最大 gap |
| 缺失 | 某 field 在桶内无点 vs 整段 series 不存在，分开统计 |
| 数值错误 | 极值、跳变、OHLC 包络；降采样前后对照 |
| 时效 | 最新点时间 vs 当前时间；写入延迟直方图 |
| 主键重复 | 同一 `(measurement, tags, timestamp)` 是否被覆盖或并存（引擎语义不同，先确认是 last-write-wins 还是多版本） |
| 跨表一致 | 分钟线重算日线后与日频库对账（时区与闭开区间先确认） |

**保存格式**：该引擎原生查询语言（Flux / InfluxQL / SQL 方言 / TDengine SQL 等），附 retention、精度与时间窗。

**TimescaleDB 特例**：本质是 Postgres + hypertable，元数据走 SQL catalog，但连续聚合视图（CAGG）是物化近似，点时结论要用原始 hypertable 或固定物化水位。

---

## 向量库（Milvus / Zilliz / 同类）

投研常见用途：研报/公告语义检索、相似标的、知识库召回。质检对象通常是**向量与元数据的对齐**，不是向量数值本身的“对错”。

**元数据先读**

- collection schema：主键、标量字段、向量维度、metric type（IP/L2/Cosine）、索引类型。
- 行数、分区/分片、embedding 模型名与版本（若有）。

**查询边界**

- 只做只读 `query` / `search`；禁止 `insert`/`upsert`/`delete`/`drop`。
- 标量过滤 + `limit`；向量检索的 topK 计入预算。
- ANN 结果是近似召回，**不得**用一次 search 的召回率差异直接 BLOCK 数据正确性；最多 WATCH，除非有精确检索基线或全量对账。

**缺陷族落地提示**

| 缺陷族 | 在 Milvus 上怎么查 |
|---|---|
| 主键重复 | 按业务主键 query；同一 id 多分区出现要报 |
| 缺失 | 标量字段为空；向量维度为 0 / null；有文档无向量或有向量无元数据 |
| 连续性 | 按入库时间或业务日期统计每日新增向量数，找断档 |
| 数值错误 | 维度与声明不一致；全 0 向量、NaN；归一化约定与 metric 不匹配 |
| 时效 | 最新入库时间 vs 源库文档更新时间 |
| 接口层 | topK/过滤条件是否被服务端静默改写；请求 N 个 id 是否都返回 |
| 跨源一致 | 源文档 id 集合与 collection 主键集合做差集（这是最有价值的检查） |

**保存格式**：可重跑的 query/search 请求（SDK 脚本或 REST JSON），附 collection 名、维度、metric、模型版本。

---

## 文件与对象存储

- **Parquet/ORC**：先读 footer、schema、row-group 统计与分区路径。
- **CSV/JSONL**：确认编码、分隔符、压缩；设字节与行数边界。
- **Iceberg/Delta/Hudi**：固定 snapshot/version，保存 manifest；当前视图不能证明历史点时状态。

用能真实重跑的脚本或引擎查询保存，不要改名成 `.sql`。

---

## HTTP API / MCP / 其他非 SQL

- 只读 endpoint、分页上限、时间/实体过滤、调用次数预算。
- 保存请求模板、脱敏参数、响应 schema、游标/页码、供应商版本。
- 流式数据固定可重放 offset、时间窗或快照；无法固定时只报告观察窗口。
- **接口层缺陷**（传 N 返少、静默截断、失效标的被捞出）优先在这一层用请求/返回对账验证。

---

## 语义不变项

无论哪种引擎：

- `OBSERVED` 必须来自实际执行结果或文件；
- `INFERRED` 只能产生 WATCH；
- PASS/BLOCK 必须有 `CONFIRMED` 口径和同范围观察；
- 查询预算、只读边界、敏感数据限制和版本化交付继续适用；
- 近似聚合、ANN 召回、降采样、系统采样、最终态视图必须明确标注，不能伪装成精确或点时证据；
- 引擎差异不改变缺陷族与市场/标的判定前提，只改变怎么把检查写出来。
