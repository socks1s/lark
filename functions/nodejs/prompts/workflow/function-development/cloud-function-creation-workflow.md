# Cloud Function Creation Workflow

## 📝 概述

创建符合飞书云函数规范格式的完整工作流程。本工作流程专注于云函数的创建步骤和操作规范，确保创建的云函数能够正确运行和调试。

## ⚠️ 必读前置知识
在执行本工作流程前，**必须**先完整阅读以下文档，否则不可进行后续操作：

### 2. 函数文件结构指南 - 文件组织规范
- **为什么必读**：了解云函数的三个核心文件（index.js、index.meta.json、debug.param.json）的作用和关系，确保文件创建正确
- **文档链接**：[云函数的基本组成与目录结构](../../knowledge-base/function-management/cloud-function-basic-structure-and-directory.md)

### 3. Index.js 文件标准化规范指南 - 主函数文件编写规范
- **为什么必读**：掌握云函数主文件的标准化编写规范，包括入参解构赋值、结果对象预构建等核心要求，确保代码的一致性和可维护性
- **文档链接**：[Index.js 文件标准化规范指南](../../knowledge-base/function-management/index-js-standardization-guide.md)

### 4. index.meta.json 文件结构完全指南 - 元数据配置详解
- **为什么必读**：全面掌握 `index.meta.json` 文件的完整结构、核心字段详解、参数类型定义和编写最佳实践，确保在创建过程中能正确创建符合规范的元数据配置文件，避免因配置错误导致的发布失败
- **文档链接**：[Index.meta.json 文件结构完全指南](../../knowledge-base/function-management/index-meta-json-structure-guide.md)

### 5. 调试参数JSON指南 - 测试参数配置
- **为什么必读**：掌握 `debug.param.json` 文件的详细配置方法，这是创建后进行函数调试和测试的必备技能，确保测试参数格式正确
- **文档链接**：[调试参数JSON指南](../../knowledge-base/testing/debug-param-json-guide.md)

### 6. 函数API名称查找方法 - 命名规范
- **为什么必读**：掌握如何正确获取和使用函数的API名称，避免命名冲突和调用错误
- **文档链接**：[如何查看函数 ApiName](../../knowledge-base/function-management/how-to-find-function-apiname.md)

### 7. 飞书云函数调用指南 - 函数间调用方法
- **为什么必读**：在创建过程中如果需要调用其他云函数，掌握 `faas.function().invoke()` 方法是推荐的最佳实践，相比普通方法更加规范和高效
- **文档链接**：[飞书云函数调用指南](../../knowledge-base/function-management/faas-function-invoke-guide.md)

## 🎯 核心原则

1. **遵循飞书云函数标准** - 严格按照规范进行创建
2. **确保可调试性** - 创建后必须能正常调试测试
3. **保持代码规范** - 遵循标准化编写规范

## 🔄 创建流程

### 第一阶段：准备
- 分析函数的业务需求和功能
- 确定函数的输入输出参数
- 确定新函数API名称
- **⚠️ 重要**：新创建的函数必须在 `testing-functions` 目录中进行开发和测试

**详细指导文档**：
- [云函数的基本组成与目录结构](../../knowledge-base/function-management/cloud-function-basic-structure-and-directory.md) - 创建技术规范
- [如何查看函数 ApiName](../../knowledge-base/function-management/how-to-find-function-apiname.md) - API名称确定方法

**目录结构要求**：
```
testing-functions/
└── 你的新函数名/
    ├── index.js
    ├── index.meta.json
    └── debug.param.json
```

### 第二阶段：创建
1. **在testing目录创建函数文件夹** - 在 `testing-functions` 目录下创建新函数的文件夹
2. **编写主函数（`index.js`）** - 按照标准化规范编写函数入口和代码结构
3. **创建配置文件（`index.meta.json`）** - 生成元数据配置和调试参数文件
4. **创建调试参数文件（`debug.param.json`）** - 配置测试参数和调试选项

**⚠️ 重要提醒**：
- 新函数必须在 `testing-functions` 目录中创建
- 完成测试验证后，再考虑将函数移动到正式的modules目录中（用户自行移动文件夹，ai助手不考虑）

**详细指导文档**：
- [云函数的基本组成与目录结构](../../knowledge-base/function-management/cloud-function-basic-structure-and-directory.md) - 目录结构规范
- [Index.js 文件标准化规范指南](../../knowledge-base/function-management/index-js-standardization-guide.md) - 主函数编写规范
- [Index.meta.json 文件结构完全指南](../../knowledge-base/function-management/index-meta-json-structure-guide.md) - 元数据配置详解
- [调试参数JSON指南](../../knowledge-base/testing/debug-param-json-guide.md) - 调试参数配置
- [飞书云函数调用指南](../../knowledge-base/function-management/faas-function-invoke-guide.md) - 函数间调用方法（如需调用其他云函数）

### 第三阶段：云端测试验证（必须）
⚠️ **重要**：创建完成后必须进行云端测试验证，确保函数正常运行后才能结束整个创建过程。

**测试步骤**：
1. 在 `testing-functions` 目录中完成函数开发
2. 使用 `ae function dev 函数名` 进行云端测试
3. 验证函数功能正常后，考虑是否需要移动到正式目录

**详细指导文档**：
- [函数测试工作流程](../function-testing/function-testing-workflow.md) - 测试流程和要求

## 📋 检查清单

### 创建执行检查
- [ ] **目录位置**：函数已在 `testing-functions` 目录中创建
- [ ] 函数入口格式：`module.exports = async function (params, context, logger)`
- [ ] 入参解构赋值：已对 `params` 进行解构赋值并设置默认值
- [ ] 结果对象预构建：已预先构建完整的结果对象结构
- [ ] 日志替换：所有 `console.log()` 已替换为 `logger.info()`
- [ ] 配置文件：`index.meta.json` 和 `debug.param.json` 创建完整

### 验证测试检查
- [ ] 函数能通过 `ae function dev` 正常启动
- [ ] 参数传递和获取正确
- [ ] 返回值格式正确
- [ ] 错误处理机制有效
- [ ] **测试完成**：在testing目录中完成所有测试验证

### 正式部署检查（可选）
- [ ] testing目录中的函数运行完全正常
- [ ] 已确定函数的正式分类目录
- [ ] 函数已移动到正式的modules目录
- [ ] 相关文档已更新

## ⚠️ 常见错误

1. **目录位置错误** - 直接在 `/functions/nodejs/` 中创建新函数，而非在 `testing-functions` 中
2. **入参解构赋值缺失** - 直接使用 `params.xxx` 而非解构赋值
3. **结果对象预构建缺失** - 动态构建返回对象导致结构不一致
4. **日志输出遗漏** - 部分 `console.log()` 未替换
5. **元数据配置错误** - 参数类型或必填属性配置错误
6. **调试参数格式错误** - `debug.param.json` 格式不规范
7. **跳过测试阶段** - 未在testing目录中充分测试就直接部署到正式目录

## 💡 最佳实践

1. **遵循标准化规范** - 严格按照文档规范编写代码
2. **充分测试** - 准备多种测试场景
3. **文档记录** - 记录关键决策和修改点

## 🔗 相关文档

- [函数测试工作流程](../function-testing/function-testing-workflow.md)
- [如何创建唯一函数名](../../knowledge-base/function-management/how-to-create-unique-function-name.md)
