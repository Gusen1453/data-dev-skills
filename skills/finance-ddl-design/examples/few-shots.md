# 正反例

## 正例 1：探索惯例后新建行情表

**需求**：给 A 股加一张日频行情表。库内已有 `dwd_hk_stock_daily_bar`、`dwd_cn_index_daily_bar`。

**探索**（`exploration.md` 步骤）：information_schema 显示表名统一 `dwd_<market>_<type>_daily_bar`；金额列 `*_amt` 用 `decimal(20,4)`；代码列 `sec_code varchar(10)` 保留前导零；时间列 `trade_date date`；分区键 `pt` 进入主键；列注释含单位。三条强惯例。

**产出 DDL**（MySQL 方言，节选）：

```sql
CREATE TABLE dwd_cn_stock_daily_bar (
  sec_code    VARCHAR(10)  NOT NULL COMMENT '证券代码，6位数字保留前导零；单位：无；来源：交易所',
  trade_date  DATE         NOT NULL COMMENT '交易日，按上交所/深交所日历；单位：无',
  open_price  DECIMAL(20,4) NOT NULL COMMENT '开盘价，未复权；单位：元',
  high_price  DECIMAL(20,4) NOT NULL COMMENT '最高价，未复权；单位：元',
  low_price   DECIMAL(20,4) NOT NULL COMMENT '最低价，未复权；单位：元',
  close_price DECIMAL(20,4) NOT NULL COMMENT '收盘价，未复权；单位：元',
  volume_qty  DECIMAL(20,2) NOT NULL COMMENT '成交量；单位：股',
  turnover_amt DECIMAL(20,4) NOT NULL COMMENT '成交额；单位：元',
  adj_factor  DECIMAL(20,8) NOT NULL COMMENT '后复权累计因子，前复权=后复权/最新因子；来源：供应商复权表',
  is_suspended TINYINT(1)  NOT NULL COMMENT '是否停牌，停牌日保留行并置1；0=正常',
  pt          VARCHAR(8)   NOT NULL COMMENT '分区键，格式yyyyMMdd',
  PRIMARY KEY (sec_code, trade_date, pt)
) COMMENT='A股日频行情，未复权+后复权因子；停牌日保留行；单位：价格元、数量股、金额元；来源：供应商X'
PARTITION BY RANGE COLUMNS(pt) (...);
```

**说明**：跟随库内三层强惯例（命名/类型/键）；停牌约定、复权口径写进表注释；分区键进主键；`adj_factor` 单独存，不覆盖原始价。

## 正例 2：兼容迁移而非重建

**需求**：已有 `dwd_cn_stock_daily_bar` 加 `chg_rate` 列，同时口径变化要加 `close_price_adj`。

**产出**：

```sql
ALTER TABLE dwd_cn_stock_daily_bar
  ADD COLUMN chg_rate DECIMAL(10,4) NULL COMMENT '涨跌幅，百分数（5.00=5%）；来源：供应商X'
  AFTER turnover_amt;

ALTER TABLE dwd_cn_stock_daily_bar
  ADD COLUMN close_price_adj DECIMAL(20,4) NULL COMMENT '后复权收盘价，=close_price*adj_factor；单位：元；来源：派生';
```

**说明**：`ADD COLUMN` 可空、不重建；口径变更开新列不动旧列；回填 SQL 幂等、参数化时间窗；契约同步加两字段并标 `CONFIRMED`。

## 反例 1：不探索就套模板

```sql
CREATE TABLE stock_bar (
  code INT PRIMARY KEY,          -- 丢前导零：000001 变 1
  date VARCHAR(10),              -- 日期存字符串，区间查询与日历 join 全错
  close FLOAT,                   -- 浮点价格，复算对不上
  amount FLOAT                   -- 不写单位：元还是亿元
);
```

**问题**：未探索库内惯例；代码用 INT、日期用 VARCHAR、价格用 FLOAT、无注释无单位。逐条违反硬性规范 4、5、6、7。

## 反例 2：破坏性 DDL 直接执行

```sql
DROP TABLE dwd_cn_stock_daily_bar;  -- 未获批准
ALTER TABLE dwd_cn_stock_daily_bar
  MODIFY close_price DECIMAL(30,10); -- 改类型重建，无回滚
```

**问题**：默认只产出脚本；删表、改类型必须用户对具体语句明确批准，且要回滚语句与影响说明。

## 反例 3：单位与时区靠猜

```sql
CREATE TABLE fund_nav (
  fund_code VARCHAR(10) NOT NULL,
  nav_date  DATE        NOT NULL,
  nav       DECIMAL(20,4) NOT NULL,   -- 单位净值还是累计净值？注释没写
  publish_time TIMESTAMP NOT NULL     -- 上海时间还是UTC？没声明
);
```

**问题**：`nav` 与 `acc_nav` 语义混用、`publish_time` 时区未声明。质检只能给 WATCH；正确做法是 `nav`/`acc_nav` 分列 + 表注释声明时区与币种。
