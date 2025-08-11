 对象数据接口（application.data.object）

## 功能描述

函数节点提供了一套简单易用的数据操作功能，在自定义函数中，无需安装和引用，只需通过 `application.data.*` 即可进行操作 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

### 限制说明

- 平台层面对数据操作的数据量大小限制为 50 M <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>
- 每次数据读写会产生远程调用，批量数据处理建议使用批量接口 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>

## 接口结构

```javascript
application
├── data
│   ├── object(objectAPIName: string)
│   │   ├── useUserAuth()
│   │   ├── useSystemAuth()
│   │   ├── create()
│   │   ├── batchCreate()
│   │   ├── update()
│   │   ├── batchUpdate()
│   │   ├── delete()
│   │   ├── batchDelete()
│   │   ├── findOne()
│   │   ├── find()
│   │   ├── findStream(records => {})
│   │   └── count()
```

## 基础语法

```javascript
application.data.object(objectAPIName)
```

**参数**：
- `objectAPIName` (string): 对象的 API 名称

## 权限控制方法

### useUserAuth()

使用用户权限进行数据操作 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").useUserAuth()
```

### useSystemAuth()

使用系统权限进行数据操作 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").useSystemAuth()
```

## 数据写入方法

### create()

创建一条记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").create(recordData)
```

### batchCreate()

批量创建记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").batchCreate(recordsArray)
```

### update()

更新一条记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").update(recordData)
```

### batchUpdate()

批量更新记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").batchUpdate(recordsArray)
```

### delete()

删除一条记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").delete(recordId)
```

### batchDelete()

批量删除记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").batchDelete(recordIdsArray)
```

## 数据查询方法

### findOne()

查找单条记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").findOne(queryConditions)
```

### find()

查找多条记录 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").find(queryConditions)
```

### findStream(callback)

流式查询记录，适用于大数据量处理 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").findStream(records => {
    // 处理每批记录
    records.forEach(record => {
        console.log(record);
    });
})
```

### count()

统计记录数量 <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>。

```javascript
application.data.object("objectAPIName").count(queryConditions)
```

## 使用示例

### 基础 CRUD 操作

```javascript
// 创建记录
let newRecord = await application.data.object("employee").create({
    name: "张三",
    department: "技术部",
    email: "zhangsan@example.com"
});

// 查询单条记录
let employee = await application.data.object("employee").findOne({
    where: { _id: newRecord._id }
});

// 更新记录
await application.data.object("employee").update({
    _id: employee._id,
    department: "产品部"
});

// 删除记录
await application.data.object("employee").delete(employee._id);
```

### 批量操作示例

```javascript
// 批量创建
let employees = await application.data.object("employee").batchCreate([
    { name: "张三", department: "技术部" },
    { name: "李四", department: "产品部" },
    { name: "王五", department: "运营部" }
]);

// 批量查询
let allEmployees = await application.data.object("employee").find({
    where: { department: "技术部" }
});

// 统计数量
let count = await application.data.object("employee").count({
    where: { department: "技术部" }
});
```

### 流式查询示例

```javascript
// 处理大量数据
await application.data.object("employee").findStream(records => {
    // 每批处理 100 条记录
    records.forEach(record => {
        // 处理单条记录
        processEmployee(record);
    });
});
```

### 权限控制示例

```javascript
// 使用用户权限查询（只能看到用户有权限的数据）
let userVisibleEmployees = await application.data.object("employee")
    .useUserAuth()
    .find({});

// 使用系统权限查询（可以看到所有数据）
let allEmployees = await application.data.object("employee")
    .useSystemAuth()
    .find({});
```

## 最佳实践

### 1. 批量操作优化
- 对于多条记录的操作，优先使用批量接口（batchCreate、batchUpdate、batchDelete）
- 避免在循环中调用单条记录操作接口

### 2. 大数据量处理
- 使用 `findStream()` 处理大量数据，避免内存溢出
- 合理设置查询条件， 减少不必要的数据传输

### 3. 权限控制
- 根据业务需求选择合适的权限模式（useUserAuth 或 useSystemAuth）
- 敏感操作建议使用用户权限，确保数据安全

**参考来源**： <mcreference link="https://bytedance.larkoffice.com/wiki/JjGbwmUCcia4JZkQB2IchRngnZb" index="1">1</mcreference>