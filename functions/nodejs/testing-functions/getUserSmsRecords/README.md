# getUserSmsRecords 云函数

## 功能概述

基于用户权限的SMS记录查询连接器，通过联表查询实现权限控制的数据访问。

## 业务流程

### 1. 用户身份验证
- 获取当前登录用户ID (`context.user._id`)

### 2. 权限查询
- 在 `otpAuth` 对象中查找用户权限记录
- 查询条件：`employee._id` = 当前用户ID
- 获取用户的 `otpServiceName` 权限列表（多选选项）

### 3. 数据筛选
- 在 `sms` 对象中查询记录
- 筛选条件：`sms.otpServiceName`（单选）包含在用户权限范围内
- 支持分页查询

### 4. 结果返回
- 返回用户有权限访问的SMS记录
- 包含统计信息（总数、分页信息等）
- 无权限时返回空数组

## 数据结构

### otpAuth 对象
- `employee`: 关联字段，关联到用户对象
- `otpServiceName`: 多选选项，用户权限范围

### sms 对象  
- `otpServiceName`: 单选选项，服务类型标识
- 其他业务字段...

## 参数说明

### 输入参数
```javascript
{
  page: 1,        // 页码，默认1
  pageSize: 10,   // 每页数量，默认10
  // 其他筛选参数...
}
```

### 返回值
```javascript
{
  success: true,
  data: {
    records: [],      // SMS记录列表
    pagination: {
      page: 1,        // 当前页码
      pageSize: 10,   // 每页数量
      total: 100,     // 总记录数
      totalPages: 10  // 总页数
    },
    statistics: {
      userPermissionCount: 3,  // 用户权限数量
      totalSmsRecords: 100     // 符合条件的SMS总数
    }
  }
}
```

## 权限逻辑

1. **权限验证**：用户必须在 `otpAuth` 中有对应的权限记录
2. **范围控制**：只能访问权限范围内的SMS记录
3. **数据隔离**：不同用户看到不同的数据集合

## 异常处理

- 用户无权限记录：返回空数组
- 参数错误：返回错误信息
- 数据库查询异常：记录日志并返回错误

## 使用场景

适用于需要基于用户权限进行数据访问控制的场景，如：
- 多租户系统的数据隔离
- 基于角色的数据访问控制
- 服务权限管理系统