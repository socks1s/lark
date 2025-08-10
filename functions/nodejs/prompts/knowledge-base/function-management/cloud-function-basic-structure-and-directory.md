# 云函数的基本组成与目录结构 (Cloud Function Basic Structure and Directory)

## 概述 (Overview)

本文档详细介绍了飞书低代码云函数的基本构造、目录结构和核心文件配置。每个云函数都包含三个核心文件：`index.js`、`index.meta.json` 和 `debug.param.json`，这些文件共同构成了一个完整的云函数实例。

## 飞书云函数目录结构 (Feishu Cloud Function Directory Structure)

### 标准目录结构 (Standard Directory Structure)
```
functionName/
├── index.js              # 主函数文件（必需）- Main function file (Required)
├── index.meta.json       # 元数据配置文件（必需）- Metadata configuration file (Required)
├── debug.param.json      # 调试参数文件（必需）- Debug parameter file (Required)
├── package.json          # 依赖配置文件（可选）- Dependency configuration file (Optional)
├── node_modules/         # 依赖包目录（可选）- Dependencies directory (Optional)
└── ...                   # 其他辅助文件（可选）- Other auxiliary files (Optional)
```

### 核心文件详细说明 (Core Files Detailed Description)

#### 1. index.js（主函数文件 / Main Function File）
- **作用 (Purpose)**：包含函数的主要业务逻辑和入口点
- **要求 (Requirements)**：
  - 必须遵循飞书云函数的标准入口格式
  - 需要正确导出主函数
  - 支持异步操作和错误处理
- **详细规范 (Detailed Specifications)**：参考 [Index.js 文件标准化规范指南](./index-js-standardization-guide.md)

#### 2. index.meta.json（元数据配置文件 / Metadata Configuration File）
- **作用 (Purpose)**：定义函数的元数据信息、输入输出参数、函数描述等
- **要求 (Requirements)**：
  - 准确描述函数的接口规范
  - 定义输入输出参数的类型和结构
  - 包含函数的基本信息和描述
- **详细配置 (Detailed Configuration)**：参考 [Index.meta.json 文件结构指南](./index-meta-json-structure-guide.md)

#### 3. debug.param.json（调试参数文件 / Debug Parameter File）
- **作用 (Purpose)**：提供函数调试时使用的测试参数和模拟数据
- **要求 (Requirements)**：
  - 参数格式必须与元数据定义严格匹配
  - 提供完整的测试用例数据
  - 支持多种调试场景
- **详细配置 (Detailed Configuration)**：参考 [调试参数JSON指南](../testing/debug-param-json-guide.md)

## 文件关系与依赖 (File Relationships and Dependencies)

### 文件间的协作关系
1. **index.js** ← 核心业务逻辑实现
2. **index.meta.json** ← 定义接口规范，为 index.js 提供元数据描述
3. **debug.param.json** ← 基于 index.meta.json 的参数定义提供测试数据

### 开发流程建议
1. 首先设计 `index.meta.json`，明确函数接口
2. 基于接口规范实现 `index.js` 业务逻辑
3. 创建 `debug.param.json` 进行函数测试和调试

## 最佳实践 (Best Practices)

### 目录命名规范
- 使用有意义的函数名称
- 采用驼峰命名法或下划线分隔
- 避免使用特殊字符和空格

### 文件维护建议
- 保持三个核心文件的同步更新
- 定期检查参数定义的一致性
- 及时更新文档和注释

## 相关文章 (Related Articles)
- **函数API名称查找方法 (Function API Name Lookup Method)**：学会如何正确获取和使用函数的API名称，确保函数调用的准确性
  - 文档链接：[how-to-find-function-apiname.md](./how-to-find-function-apiname.md)