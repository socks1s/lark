# OQL查询综合指南

## 📝 概述

OQL (Object Query Language) 是飞书低代码平台提供的一种针对面向对象数据库设计的查询语言标准，采用类似 SQL 的语法对记录进行 CRUD 操作。本指南整合了OQL的使用说明、应用指南和典型案例，为开发者提供完整的OQL查询参考。

## 🎯 什么是 OQL

OQL (Object Query Language) 是平台提供的一种针对面向对象数据库设计的查询语言标准，具有以下特点：

- **SQL风格语法**：采用类似 SQL 的语法进行数据操作
- **面向对象设计**：专门针对面向对象数据库优化
- **功能扩展**：在链式接口基础上提供更强大的数据操作能力
- **多场景支持**：支持云函数、自定义组件、JS自定义事件等多种使用场景

## 🔄 OQL vs 链式 DB 接口

### OQL的优势
1. **SQL风格的数据操作方式**：更符合传统数据库操作习惯
2. **功能扩展**：支持聚合计算、Hierarchy 查询、查询结果的行内计算等复杂操作
3. **复杂查询支持**：通过链式接口无法实现或实现复杂的数据操作，可通过 OQL 轻松实现

## 🚀 使用场景与接口

### 云函数中使用

> ⚠️ **重要提醒**：在云函数中，必须使用 `context.db.oql(oql).execute()` 语法，不要与前端页面的 `application.data.oql(oql)` 语法混淆！

#### 执行固定 OQL 语句
```javascript
// @kldx/core 版本需要 4.13.x 及以上
// 云函数中的正确写法
const oql = "SELECT _id, _name FROM _user WHERE _type = '_employee' LIMIT 10";
const records = await context.db.oql(oql).execute();
```

#### 执行含参数的 OQL 语句
```javascript
// @byted-apaas/server-sdk-node 版本需要 1.0.9 及以上
// 云函数中的正确写法
const oql = `SELECT _id, _name FROM _user WHERE _type = $user_type AND _accountStatus = $user_status LIMIT 10`;
const records = await context.db.oql(oql, {
    user_type: "_employee",
    user_status: "_used",
}).execute();
```

### 自定义组件中使用

#### 执行固定 OQL 语句
```javascript
// @byted-apaas/data版本需要1.8.0及以上
import { oql } from '@byted-apaas/data';
const oqlStatement = "SELECT _id, _name FROM _user WHERE _type = '_employee' LIMIT 10";
const records = await oql(oqlStatement);
```

#### 执行含参数的 OQL 语句
```javascript
import { oql } from '@byted-apaas/data';
let employees = await oql("select _email from _user where _type = $user_type", {
    "user_type": "_employee",
});
```

### JS自定义事件/HTML中使用（前端页面）

> 📝 **注意**：以下语法仅适用于前端页面的 JS自定义事件/HTML 中，在云函数中不适用！

#### 执行固定 OQL 语句
```javascript
// 前端页面中的写法
const oql = "SELECT _id, _name FROM _user WHERE _type = '_employee' LIMIT 10";
const records = await application.data.oql(oql);
```

#### 执行含参数的 OQL 语句
```javascript
// 前端页面中的写法
let employees = await application.data.oql("select _email from _user where _type = $user_type", {
    "user_type": "_employee",
});
```

## 📊 支持的对象类型

### 单对象查询

| 对象类型 | 查询示例 | 数据源类型 | 支持状态 |
|---------|---------|-----------|---------|
| 共享对象 | `SELECT _id FROM Object` | 共享对象 | ✅ |
| 跨 GEO 对象 | `SELECT _id FROM Object` | 跨 GEO 对象 | ✅ |
| 内部对象 | `SELECT _id FROM Object` | 内部对象 | ✅ |
| 外部对象（ClickHouse） | `SELECT _id FROM Object` | 外部对象 | ✅ |
| 外部对象（MySQL） | `SELECT _id FROM Object` | 外部对象 | ✅ |
| 外部对象（OData） | `SELECT _id FROM Object` | 外部对象 | ✅ |

### 多对象查询（JOIN语法）

```sql
SELECT Object_1.name, Object_2.name
FROM Object_1 
JOIN Object_2 
ON Object_1.id = Object_2.id
```

**支持的JOIN类型**：
- **内部对象 JOIN 内部对象** ✅
- **外部对象 JOIN 外部对象** ✅（同源要求）
- **外部对象 JOIN 内部对象** ❌
- **内部对象 JOIN 外部对象** ❌

**特殊说明**：
- 外部对象联表均要求同源，即使用一个连接凭证
- 不支持 RIGHT JOIN

### 多对象查询（下钻语法）

```sql
SELECT _id, lookup.name 
FROM Object
```

**支持的下钻类型**：
- **内部对象.内部对象** ✅
- **外部对象.外部对象** ✅
- **内部对象.外部对象** ❌（目前不支持）
- **外部对象.内部对象** ❌

## 🔧 基础关键字支持

### 已支持的关键字

| 关键字 | 语法 | 示例 |
|-------|------|------|
| ✅ SELECT | `SELECT expression [ [ AS ] alias ] [, ...]` | `SELECT _name, age FROM employee` |
| ✅ FROM | `[ FROM object_source [ [ AS ] alias] ]` | `FROM employee` |
| ✅ WHERE | `[ WHERE expression ]` | `WHERE age > 30` |
| ✅ AS | `expression [ [ AS ] alias ]` | `SELECT _name AS name` |
| ✅ LIMIT | `LIMIT [offset,] count [ OFFSET offset ]` | `LIMIT 20 OFFSET 30` |
| ✅ OFFSET | `LIMIT 20 OFFSET 30` | `LIMIT 20 OFFSET 30` |
| ✅ GROUP BY | `GROUP BY fieldApiname [, ...]` | `GROUP BY service_id` |
| ✅ ORDER BY | `ORDER BY expression [ ASC \| DESC] [ NULLS { FIRST \| LAST } ] [, ...]` | `ORDER BY _createdAt DESC` |
| ✅ ASC/DESC | `ORDER BY expression ASC/DESC` | `ORDER BY _createdAt DESC` |
| ✅ NULLS FIRST/LAST | `ORDER BY expression NULLS FIRST` | `ORDER BY _createdAt NULLS FIRST` |
| ✅ Subquery | `WHERE column IN (SELECT ...)` | 见下方示例 |

### LIMIT 语法示例

```sql
-- 基础限制
LIMIT 20;

-- 带偏移量的限制
LIMIT 30,20;
LIMIT 20 OFFSET 30;

-- 完整示例
SELECT _name, _createdAt, _updatedAt
FROM _user
LIMIT 20 OFFSET 30;
```

### GROUP BY 语法示例

```sql
-- 按字段分组
SELECT service_id, COUNT(package_name)
FROM cloud_function_npm_package
GROUP BY service_id;

-- 按位置分组
SELECT package_name, COUNT(package_name)
FROM cloud_function_npm_package
GROUP BY 1;

-- 按别名分组
SELECT package_name AS package, COUNT(package_name)
FROM cloud_function_npm_package
GROUP BY package;
```

### ORDER BY 语法示例

```sql
-- 多字段排序
SELECT _name, _createdAt, _updatedAt
FROM _user
ORDER BY _createdAt, _updatedAt DESC;

-- 按位置排序
SELECT _name, _createdAt, _updatedAt
FROM _user
ORDER BY 2, 3 DESC;

-- 按别名排序
SELECT _name, _createdAt AS createAtAlias
FROM _user
ORDER BY createAtAlias;
```

### 子查询示例

```sql
SELECT Websites.name, Websites.url 
FROM Websites 
WHERE id IN (
    SELECT website_id
    FROM access_log 
    WHERE Websites.id = access_log.site_id 
    AND count > 200
);
```

## 📋 字段类型支持详解

### 文本类型

<mcreference link="https://ae.feishu.cn/hc/zh-CN/articles/077044426966" index="0">0</mcreference>

**查询示例**：
```sql
SELECT _id 
FROM Object 
WHERE text = 'a'
```

**返回值格式**：字符串 String `"text"`

**支持的操作符**：
- 长文本：`IS NULL`, `IS NOT NULL`
- 加密 - 非确定性加密：不支持任何操作符
- 加密 - 保序加密：`IS NULL`, `IS NOT NULL`, `=`, `!=/<>`, `<=`, `<`, `>=`, `>`, `IN`
- 加密 - 固定加密：`IS NULL`, `IS NOT NULL`, `IN`
- 其他：`IS NULL`, `IS NOT NULL`, `=`, `!=/<>`, `LIKE`, `NOT LIKE`, `IN`

**支持的函数**：`COUNT(DISTINCT)`, `COUNT`, `TO_DATE`, `SPLIT_BY_CHAR`, `CONCAT`, `COALESCE`, `LEAD`

### 数值类型

#### 整数类型
**查询示例**：
```sql
SELECT _id 
FROM Object 
WHERE bigint = '123456'
```

**返回值格式**：字符串 String `"922337203685477580"`

**支持的操作符**：`+-*/ %`，以及各种比较操作符

**支持的函数**：`COUNT(DISTINCT)`, `COUNT`, `MAX/MIN`, `SUM/AVG`, `COALESCE`, `LEAD`

#### 浮点数类型
**查询示例**：
```sql
SELECT _id 
FROM Object 
WHERE float = 123456.123
```

**返回值格式**：浮点数 Float `922337203685477580.1333`

#### 定点数类型
**查询示例**：
```sql
SELECT _id 
FROM Object 
WHERE decimal = '123456.123'
```

**返回值格式**：字符串 String `"1"`

### 布尔类型

**查询示例**：
```sql
SELECT _id 
FROM Object 
WHERE bool = TRUE
```

**返回值格式**：布尔 Bool `false`

**支持的操作符**：`IS NULL`, `IS NOT NULL`, `=`, `!=/<>`, `IS (NOT) TRUE`, `IS (NOT) FALSE`, `IN`

### 日期时间类型

#### 日期类型
**查询示例**：
```sql
SELECT _id 
FROM Object 
WHERE date = '2020-01-01'
```

**返回值格式**：字符串 String `"2022-12-25"`

**支持的函数**：`COUNT(DISTINCT)`, `COUNT`, `MAX/MIN`, `EXTRACT`, `DATE_FORMAT`, `DATE_ADD`, `COALESCE`, `LEAD`

#### 日期时间类型
**查询示例**：
```sql
SELECT _id 
FROM Object 
WHERE datetime = '2021-12-28 10:20:30'
```

**支持的时间格式**：
- `2006-01-02 15:04:05`
- `2006-01-02 15:04:05.999999999`
- `2006-01-02T15:04:05.999999999`
- `2006-01-02 15:04:05 -07:00`
- `2006-01-02 15:04:05.999999999 -07:00`

**返回值格式**：字符串 String `'2021-12-28 10:20:30'`

### 手机号码类型

<mcreference link="https://ae.feishu.cn/hc/zh-CN/articles/077044426966" index="0">0</mcreference>

**数据结构**：
```javascript
type PhoneNumber struct {
   Key      string `json:"key"`
   AreaCode string `json:"code"`
   Number   string `json:"number"`
}
```

## 💡 典型应用案例

### 案例1：用户数据查询
```sql
-- 查询所有员工用户的基本信息
SELECT _id, _name, _email
FROM _user 
WHERE _type = '_employee' 
AND _accountStatus = '_used'
ORDER BY _createdAt DESC
LIMIT 50;
```

### 案例2：聚合统计查询
```sql
-- 统计各服务的包数量
SELECT service_id, COUNT(package_name) as package_count
FROM cloud_function_npm_package
GROUP BY service_id
ORDER BY package_count DESC;
```

### 案例3：参数化查询
```sql
-- 使用参数查询特定类型用户
SELECT _id, _name, _email 
FROM _user 
WHERE _type = $user_type 
AND _department = $department
AND _createdAt >= $start_date;
```

### 案例4：JOIN查询
```sql
-- 关联查询用户和部门信息
SELECT u._name as user_name, d.name as department_name
FROM _user u
JOIN department d ON u._department = d._id
WHERE u._type = '_employee';
```

### 案例5：子查询应用
```sql
-- 查询有访问记录的网站
SELECT w.name, w.url 
FROM websites w 
WHERE w.id IN (
    SELECT DISTINCT website_id
    FROM access_log 
    WHERE visit_count > 100
);
```

### 案例6：日期范围查询
```sql
-- 查询最近30天创建的用户
SELECT _id, _name, _createdAt
FROM _user 
WHERE _createdAt >= DATE_ADD(CURRENT_DATE, INTERVAL -30 DAY)
ORDER BY _createdAt DESC;
```

### 案例7：模糊查询
```sql
-- 按名称模糊查询用户
SELECT _id, _name, _email
FROM _user 
WHERE _name LIKE '%张%' 
AND _type = '_employee';
```

## ⚠️ 使用限制与注意事项

### 数据量限制
- **单次查询数据量限制**：200条记录（聚合计算查询为1000条）
- **单次创建、更新、删除数据量限制**：100条记录

### 语法注意事项
- **字符串值**：必须使用单引号包围，如 `'value'`
- **参数命名**：参数使用 `$parameter_name` 格式
- **字段引用**：使用字段的 API 名称，而非显示名称

### 外部对象限制
- **同源要求**：外部对象联表查询要求使用同一个连接凭证
- **JOIN限制**：不支持 RIGHT JOIN
- **跨数据源限制**：不支持跨数据源的下钻查询

### 加密字段限制
- **非确定性加密**：不支持任何操作符
- **保序加密**：支持比较操作符
- **固定加密**：仅支持 `IS NULL`, `IS NOT NULL`, `IN` 操作符

## 🔍 最佳实践

### 1. 正确选择OQL语法
- **云函数中**：必须使用 `await context.db.oql(oql).execute()` 语法
- **前端页面中**：使用 `await application.data.oql(oql)` 语法
- **自定义组件中**：使用 `import { oql } from '@byted-apaas/data'` 然后 `await oql(oqlStatement)`
- ⚠️ **切勿混淆**：不同环境下的语法不可互换使用

### 2. 查询优化
- 合理使用 `LIMIT` 控制返回数据量
- 在 `WHERE` 条件中优先使用索引字段
- 避免在大数据集上使用复杂的聚合函数

### 3. 参数化查询
- 使用参数化查询防止SQL注入
- 合理命名参数，提高代码可读性
- 验证参数值的有效性

### 4. 错误处理
```javascript
// 云函数中的错误处理示例
try {
    const records = await context.db.oql(oql, params).execute();
    return records;
} catch (error) {
    logger.error('OQL查询失败', { error: error.message, oql, params });
    throw error;
}
```

### 5. 性能监控
- 记录查询执行时间
- 监控查询返回的数据量
- 定期优化慢查询

## 📚 相关参考文档

- [对象数据接口指南](./object-data-interface-guide.md) - application.data.object接口的完整使用指南
- [事务接口指南](./transaction-interface-guide.md) - 事务操作的使用方法

## 🌐 官方文档参考

- <mcreference link="https://ae.feishu.cn/hc/zh-CN/articles/077044426966" index="0">OQL 使用说明</mcreference>
- <mcreference link="https://ae.feishu.cn/hc/zh-CN/articles/277155108713" index="1">OQL 应用指南</mcreference>