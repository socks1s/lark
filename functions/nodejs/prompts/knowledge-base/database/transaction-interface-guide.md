 事务接口（application.data.newTransaction）

## 功能描述

事务作为单个逻辑工作单元执行的一系列操作，可以保证多个数据库写入操作的原子性 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

### 限制说明

- 事务中的总注册量限制为 50 条 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>
- 总批量操作（含创建、更新、删除）的数据量限制 500 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>

## 语法

```javascript
let tx = application.data.newTransaction();
```

## 方法

### object(objApiName)

设置要操作的对象 API 名称。

```javascript
tx.object("objApiName")
```

**参数**：
- `objApiName` (string): 对象的 API 名称

### registerCreate(param): PreCreateResult

注册创建单条记录操作 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

```javascript
tx.object("objApiName").registerCreate(param)
```

**返回值**：PreCreateResult 对象

### registerUpdate(param): void

注册更新单条记录操作 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

```javascript
tx.object("objApiName").registerUpdate(param)
```

### registerDelete(param): void

注册删除单条记录操作 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

```javascript
tx.object("objApiName").registerDelete(param)
```

### registerBatchCreate(params): ids[]

注册批量创建记录操作 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

```javascript
tx.object("objApiName").registerBatchCreate(params)
```

**返回值**：记录 ID 数组

### registerBatchUpdate(params): void

注册批量更新记录操作 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

```javascript
tx.object("objApiName").registerBatchUpdate(params)
```

### registerBatchDelete(params): void

注册批量删除记录操作 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

```javascript
tx.object("objApiName").registerBatchDelete(params)
```

### commit(): void

提交事务，执行所有注册的操作 <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>。

```javascript
tx.commit()
```

## 示例

### 基础示例

```javascript
let tx = application.data.newTransaction();

// 创建员工记录
let employee = tx.object("employee").registerCreate({
    _name: new kunlun.type.Multilingual({zh: "张三", en: "zhangsan"})
});

// 提交事务
tx.commit();
```

### 批量操作示例

```javascript
let tx = application.data.newTransaction();

// 批量创建多条记录
let employeeIds = tx.object("employee").registerBatchCreate([
    { _name: new kunlun.type.Multilingual({zh: "张三", en: "zhangsan"}) },
    { _name: new kunlun.type.Multilingual({zh: "李四", en: "lisi"}) },
    { _name: new kunlun.type.Multilingual({zh: "王五", en: "wangwu"}) }
]);

// 批量更新记录
tx.object("employee").registerBatchUpdate([
    { _id: 123, status: "active" },
    { _id: 124, status: "inactive" }
]);

// 提交事务
tx.commit();
```

**参考来源**： <mcreference link="https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f" index="0">0</mcreference>