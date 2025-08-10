# Function Testing Workflow

## ⚠️ 核心原则：必须使用云端调试

## ⚠️ 必读前置知识

### 1. 云函数基本构造与调试格式转换指南
- **相关文件**：`index.js`、`index.meta.json`、`debug.param.json`
- **文档链接**：[云函数的基本组成与目录结构](../../knowledge-base/function-management/cloud-function-basic-structure-and-directory.md)

### 2. 云函数文件结构规范 - 理解函数组织方式
- **为什么必读**：了解云函数的目录结构和命名规范，确保正确引用函数名称
- **相关文件**：`index.js`、`index.meta.json`、`debug.param.json`
- **文档链接**：[云函数的基本组成与目录结构](../../knowledge-base/function-management/cloud-function-basic-structure-and-directory.md)

### 3. Index.js 文件标准化规范指南
- **相关文件**：`index.js`
- **文档链接**：[Index.js 文件标准化规范指南](../../knowledge-base/function-management/index-js-standardization-guide.md)

### 4. Index.meta.json 文件结构完全指南
- **相关文件**：`index.meta.json`
- **文档链接**：[Index.meta.json 文件结构完全指南](../../knowledge-base/function-management/index-meta-json-structure-guide.md)

### 5. 调试参数JSON指南
- **相关文件**：`debug.param.json`
- **文档链接**：[调试参数JSON指南](../../knowledge-base/testing/debug-param-json-guide.md)

### 6. 函数API名称查找方法
- **相关文件**：`index.meta.json`
- **文档链接**：[如何查看函数 ApiName](../../knowledge-base/function-management/how-to-find-function-apiname.md)

## 测试流程

### 1. 测试准备
1. 定位函数目录
2. 检查三个文件是否存在（文件名必须严格按照规范，不可自定义，具体参考顶部文章）：
   - 主函数文件：`index.js`
   - 元数据文件：`index.meta.json`
   - 调试参数文件：`debug.param.json`
3. 获取函数 apiName（具体参考顶部文章）
4. 分析 `index.meta.json` 参数定义

### 2. 测试配置
- 编写 `debug.param.json`：参数格式严格匹配元数据定义
- 必填参数全部提供，数据类型正确

### 3. 测试执行
```bash
# 在项目根目录执行
ae function dev {functionApiName}
```

### 4. 多测试用例管理
**核心规则**：只有 `debug.param.json` 被系统执行

**操作流程**：
```bash
# 备份 → 切换 → 测试 → 恢复
mv debug.param.json debug.param.backup.json
mv debug.param.case2.json debug.param.json
ae function dev yourFunctionApiName
mv debug.param.json debug.param.case2.json
mv debug.param.backup.json debug.param.json
```

## AI测试核心要求：深度分析返回数据

**⚠️ 重要原则**：AI测试成功与否不是看有没有返回值，而是要深度分析返回数据是否符合函数逻辑

### 分析步骤
1. **理解函数逻辑**：明确函数预期行为和正常返回格式
2. **验证返回数据**：检查数据结构、字段完整性、数值合理性
3. **识别错误信息**：分析错误码、异常信息、业务逻辑错误
4. **分析关键指标**：响应时间、数据准确性、边界条件处理

### 判断标准
- ✅ **正确**：返回数据符合业务逻辑，格式正确，内容有效
- ❌ **错误**：即使有返回值，但包含错误信息或数据异常

## 问题排查

### ⚠️ 测试报错时的首要检查：飞书云函数格式要求

**测试出现报错时，必须首先按以下顺序检查文件格式：**

1. **检查 `index.js` 文件格式**
   - 参考：[Index.js 文件标准化规范指南](../../knowledge-base/function-management/index-js-standardization-guide.md)
   - 验证函数入口格式、入参解构赋值、结果对象预构建

2. **检查 `index.meta.json` 文件格式**
   - 参考：[Index.meta.json 文件结构完全指南](../../knowledge-base/function-management/index-meta-json-structure-guide.md)
   - 验证必填字段、参数类型定义、输入输出参数配置

3. **检查 `debug.param.json` 文件格式**
   - 参考：[调试参数JSON指南](../../knowledge-base/testing/debug-param-json-guide.md)
   - 验证参数格式、必填参数、数据类型

4. **检查云函数基本构造**
   - 参考：[云函数的基本组成与目录结构](../../knowledge-base/function-management/cloud-function-basic-structure-and-directory.md)
   - 验证函数标准构造、文件组织结构

### 常见错误类型
- **参数错误**：类型不匹配、必填参数缺失
- **函数逻辑错误**：业务逻辑异常、异常处理不当
- **环境问题**：网络连接、权限不足

## 🔍 测试完成后必须执行：疑难杂症记录流程

**⚠️ 这是测试完成后的必须操作，不可跳过！**

### 执行清单
- [ ] **错误识别**：确认是否遇到疑难杂症（非常见错误）
- [ ] **文档检索**：检查现有解决方案
  - [ ] 检索 `../error-solutions/testing/` 目录
  - [ ] 检查 `../knowledge-base/testing/` 相关文档
  - [ ] 检查 `../prompts/` 目录其他相关文档
- [ ] **创建条件判断**：仅在现有文档无法解决问题时创建新文档
- [ ] **文档创建**：在 `../error-solutions/testing/` 目录下创建原子化解决方案
- [ ] **文档规范检查**：遵循 [AI文档写作工作流程](../documentation-management/ai-documentation-writing-workflow.md) 的原子化要求

### 记录原则
- ✅ **记录**：疑难杂症、现有文档无解决方案
- ❌ **不记录**：简单错误、常见问题、已有解决方案