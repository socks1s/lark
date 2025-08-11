# 飞书低代码云函数目录

## 概述

本文档提供了项目中所有云函数的完整目录，以大纲树的形式展示各个函数的功能和分类。每个函数都包含其核心功能描述，便于开发者快速定位和使用。

## 函数分类目录

### 📊 数据比较与分析类 (Data Comparison & Analysis)

#### `generateDiffTree` - 差异树生成器
- **功能**: 比较两个数据对象的差异，生成详细的差异树结构
- **特点**: 支持对象、数组、基础类型的深度比较
- **位置**: `modules/generateDiffTree/`
- **ApiName**: `generateDiffTree`

### 🔄 数据增删改查类 (CRUD Operations)

#### 批量操作子类 (Batch Operations)

##### `batchUpsertRecords` - 记录批量入库
- **功能**: 批量创建或更新记录，支持按ID进行批量操作
- **特点**: 高效的批量数据处理
- **位置**: `modules/class_CURD/batchCURD/batchUpsertRecords/`
- **ApiName**: `batchUpsertRecords`

##### `batchDeleteRecords` - 批量删除记录
- **功能**: 批量删除记录，提供错误统计功能
- **特点**: 支持批量删除操作和错误处理
- **位置**: `modules/class_CURD/batchCURD/batchDeleteRecords/`
- **ApiName**: `batchDeleteRecords`

##### `batchFindRelatedRecords` - 批量查询关联记录
- **功能**: 批量查询父记录关联的子记录列表
- **特点**: 处理平台查询限制，动态处理select字段
- **位置**: `modules/class_CURD/batchCURD/batchFindRelatedRecords/`
- **ApiName**: `batchFindRelatedRecords`

##### `compareDeletedRecords` - 比较删除记录
- **功能**: 比较新旧记录列表并找出待删除记录
- **特点**: 智能识别需要删除的记录
- **位置**: `modules/class_CURD/batchCURD/compareDeletedRecords/`
- **ApiName**: `compareDeletedRecords`

#### 事务操作子类 (Transaction Operations)

##### `testTransactionBatchCreate` - 测试事务批量创建返回值
- **功能**: 测试事务批量创建操作的返回值结构
- **特点**: 验证事务提交后返回的ids数组
- **位置**: `modules/class_CURD/testTransactionBatchCreate/`
- **ApiName**: `testTransactionBatchCreate`

### 📝 记录创建编辑类 (Record Creation & Editing)

#### `createEditRecord` - 创建/编辑记录
- **功能**: 根据操作类型创建或编辑父子记录
- **特点**: 支持主子表关联操作
- **位置**: `modules/class_createEditRecord/createEditRecord/`
- **ApiName**: `createEditRecord`

#### `mainChildBindNCommit` - 智能主子表数据提交引擎
- **功能**: 智能主子表数据提交引擎
- **特点**: 支持自适应策略选择、智能数据分类和容错处理
- **位置**: `modules/class_createEditRecord/mainChildBindNCommit_todo/`
- **ApiName**: `mainChildBindNCommit`

#### `relateParentChildRecords` - 关联父子记录
- **功能**: 建立和管理父子记录之间的关联关系
- **特点**: 专门处理父子表关联逻辑
- **位置**: `modules/class_createEditRecord/relateParentChildRecords/`
- **ApiName**: `relateParentChildRecords`

### 🔄 版本控制类 (Version Control)

#### `createSnapshot` - 创建快照
- **功能**: 创建数据变更快照，记录当前数据、之前数据及变更信息
- **特点**: 完整的数据变更历史记录
- **位置**: `modules/class_version/createSnapshot/`
- **ApiName**: `createSnapshot`

#### `getLatestRecordVersion` - 获取最新版本号
- **功能**: 获取指定记录的最新版本信息
- **特点**: 版本查询和管理
- **位置**: `modules/class_version/getLatestRecordVersion/`
- **ApiName**: `getLatestRecordVersion`

#### `getLatestSnapshotVersion` - 获取最新快照版本
- **功能**: 获取最新快照版本的完整记录信息
- **特点**: 快照版本管理
- **位置**: `modules/class_version/getLatestSnapshotVersion/`
- **ApiName**: `getLatestSnapshotVersion`

#### `versionControl` - 版本控制
- **功能**: 实现记录版本控制功能
- **特点**: 包括入参校验、版本更新和状态管理
- **位置**: `modules/class_version/versionControl/`
- **ApiName**: `versionControl`

#### `versionConflictCheck` - 编辑版本冲突检测
- **功能**: 验证记录版本号是否与最新版本一致
- **特点**: 防止并发修改冲突
- **位置**: `modules/class_version/versionConflictCheck/`
- **ApiName**: `versionConflictCheck`

### 📊 测试数据获取类 (Test Data Retrieval)

#### `getTestMain` - 获取测试数据
- **功能**: 通用测试数据获取函数，支持获取单条或多条记录
- **特点**: 可指定字段、条件、分页等参数，专为测试场景设计
- **位置**: `modules/getOnlineData/getTestMain/`
- **ApiName**: `getTestMain`

#### `getTestChild` - 获取子表测试数据
- **功能**: 通用子表测试数据获取函数
- **特点**: 支持获取单条或多条子表记录，可按父记录ID查询，支持关联父记录信息
- **位置**: `modules/getOnlineData/getTestChild/`
- **ApiName**: `getTestChild`

### 🌐 领星ERP集成类 (Lingxing ERP Integration)

#### `getLingxingAccessToken` - 领星AccessToken管理
- **功能**: 领星ERP AccessToken获取和续约函数，支持获取新token和续约现有token
- **特点**: 确保API调用的持续有效性，支持get和refresh操作
- **位置**: `modules/lingxing/getLingxingAccessToken/`
- **ApiName**: `getLingxingAccessToken`

#### `getLingxingAmazonMarketplaces` - 领星亚马逊市场列表查询
- **功能**: 查询领星ERP中所有亚马逊市场列表，支持市场筛选、映射和数据统计功能
- **特点**: 支持region、country、code等字段筛选
- **位置**: `modules/lingxing/getLingxingAmazonMarketplaces/`
- **ApiName**: `getLingxingAmazonMarketplaces`

#### `getLingxingInboundShipmentList` - 领星发货单列表查询
- **功能**: 查询领星平台的发货单列表，支持多种筛选条件
- **特点**: 支持按SKU、发货单号、店铺、国家、仓库等多维度筛选
- **位置**: `modules/lingxing/getLingxingInboundShipmentList/`
- **ApiName**: `getLingxingInboundShipmentList`

### 🛠️ 工具函数类 (Utility Functions)

#### `getObjectFields` - 获取对象字段
- **功能**: 获取指定对象的所有字段信息
- **特点**: 需传入有效的对象API名称
- **位置**: `modules/utils/getObjectFields/`
- **ApiName**: `getObjectFields`

#### `getFieldDisplayName` - 获取字段显示名称
- **功能**: 获取字段的显示名称
- **特点**: 自定义函数，用于字段名称处理
- **位置**: `modules/utils/getFieldDisplayName/`
- **ApiName**: `getFieldDisplayName`

#### `getFeishuCloudFunctionExitIP` - 获取飞书云函数出口IP
- **功能**: 检测飞书云函数的出口IP地址，用于添加到第三方服务的IP白名单中
- **特点**: 支持多个IP检测服务，提供详细的检测结果和白名单建议
- **位置**: `modules/utils/getFeishuCloudFunctionExitIP/`
- **ApiName**: `getFeishuCloudFunctionExitIP`

## 函数统计信息

- **总函数数量**: 19个
- **主要分类**: 7大类
- **核心模块**: 
  - 数据操作类: 7个函数
  - 版本控制类: 5个函数
  - 领星ERP集成类: 3个函数
  - 测试数据类: 2个函数
  - 工具函数类: 3个函数

## 使用说明

1. **函数调用**: 所有函数都可以通过其ApiName在飞书低代码平台中调用
2. **参数配置**: 每个函数的详细参数配置请参考对应的`index.meta.json`文件
3. **测试调试**: 每个函数都配有`debug.param.json`测试参数文件
4. **文档查看**: 部分函数提供了详细的README.md文档

## 相关文档

- [函数测试工作流程](prompts/workflow/function-testing/function-testing-workflow.md)
- [云函数的基本组成与目录结构](prompts/knowledge-base/function-management/cloud-function-basic-structure-and-directory.md)
