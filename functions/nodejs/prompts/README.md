# Feishu Low-Code Cloud Functions Documentation Center

## 📚 文档目录 (Documentation Index)

### 🔄 工作流程 (Workflows)
完整的操作流程指南，包含明确的步骤顺序和最佳实践

#### 函数开发流程
- **[云函数创建工作流程](workflow/function-development/cloud-function-creation-workflow.md)** - 创建符合飞书云函数规范的完整流程，包括代码结构编写、元数据配置和调试参数设置

#### 函数测试流程
- **[函数测试工作流程](workflow/function-testing/function-testing-workflow.md)** - 飞书低代码云函数的完整测试流程，包括核心原则、必读前置知识、调试命令使用、测试流程执行、多测试用例管理和问题排查方法

#### 源代码管理流程
- **[AE Source Push工作流程](workflow/source-code-management/ae-source-push-workflow.md)** - ae source push 源代码推送的安全流程指南，包含推送前检查、错误处理、安全注意事项和完整的操作步骤
- **[GitHub推送完整指南](workflow/source-code-management/github-push-complete-guide.md)** - 将飞书低代码项目推送到GitHub的完整流程指南，包括初始化、冲突解决、认证配置、仓库管理等所有关键步骤和问题解决方案

#### 文档管理流程
- **[AI文档写作工作流程](./workflow/documentation-management/ai-documentation-writing-workflow.md)** - AI助手进行技术文档写作的完整工作流程，遵循原子化原则，确保文档结构清晰、内容准确、易于维护
- **[文档链接修复工作流程](./workflow/documentation-management/documentation-link-repair-workflow.md)** - 文档链接修复的标准化工作流程，确保文档间链接的正确性和可维护性
- **[文章简化提示词](workflow/documentation-management/simplify-aritcal-prompt.md)** - 文章内容重新整理的提示词，用于提高文章逻辑性、删除冗余内容和精简文章结构

#### 🔧 函数管理 (Function Management)
- **[云函数的基本组成与目录结构](./knowledge-base/function-management/cloud-function-basic-structure-and-directory.md)** - 飞书云函数的三个核心文件（index.js、index.meta.json、debug.param.json）的详细说明和使用规范
- **[Index.js文件标准化规范指南](./knowledge-base/function-management/index-js-standardization-guide.md)** - 云函数主文件（index.js）的标准化编写规范，包括函数注释、参数处理、日志记录和错误处理的最佳实践
- **[Index.meta.json文件结构指南](./knowledge-base/function-management/index-meta-json-structure-guide.md)** - 飞书低代码云函数核心配置文件的完整结构说明，包括元数据信息、输入输出参数定义
- **[飞书云函数环境变量使用指南](./knowledge-base/function-management/environment-variables-usage-guide.md)** - 在飞书低代码云函数中使用环境变量的完整指南，包括获取方法、安全最佳实践和常见使用场景
- **[FaaS函数调用指南](./knowledge-base/function-management/faas-function-invoke-guide.md)** - 在飞书云函数中使用faas.function().invoke方法调用其他云函数的完整指南，包括语法、示例和错误处理
- **[如何复制函数进行测试](./knowledge-base/function-management/how-to-copy-function-for-testing.md)** - 安全复制现有函数创建测试版本的完整流程，包括目录结构、元数据修改和版本管理
- **[如何创建唯一函数名](./knowledge-base/function-management/how-to-create-unique-function-name.md)** - 为新函数创建独一无二名称的规则和方法，包括命名规范、唯一性检查和最佳实践
- **[如何查看函数ApiName](./knowledge-base/function-management/how-to-find-function-apiname.md)** - 查找云函数ApiName的方法和步骤，包括文件结构说明和实际应用场景
- **[函数目录更新指南](./knowledge-base/function-management/function-directory-update-guide.md)** - 如何将函数录入到函数目录文档的精简流程指南，包括信息收集、分类归属和录入操作的快速步骤

#### 🗄️ 数据库操作 (Database Operations)
- **[对象数据接口指南](./knowledge-base/database/object-data-interface-guide.md)** - application.data.object接口的完整使用指南，包括CRUD操作、权限控制、批量操作和流式查询
- **[事务接口指南](./knowledge-base/database/transaction-interface-guide.md)** - application.data.newTransaction事务接口的使用方法，确保多个数据库操作的原子性
- **[OQL查询综合指南](./knowledge-base/database/oql-query-comprehensive-guide.md)** - 飞书低代码平台OQL(Object Query Language)查询语言的完整使用指南，包括语法说明、字段类型支持、典型应用案例和最佳实践

#### 🧪 测试调试 (Testing & Debugging)
- **[Debug Param JSON指南](./knowledge-base/testing/debug-param-json-guide.md)** - debug.param.json测试参数配置文件的详细编写指南，包括参数格式要求、常见类型示例和编写检查清单
- **[如何使用工具函数获取对象字段](./knowledge-base/testing/how-to-get-object-fields-using-tool-functions.md)** - 使用getObjectFields工具函数获取业务对象字段信息的完整指南，用于数据查询和测试参数配置
- **[如何使用工具函数获取真实测试数据](./knowledge-base/testing/how-to-get-real-test-data-using-tool-functions.md)** - 使用getTestMain和getTestChild工具函数从线上数据库获取真实业务数据的详细指南

#### 🌐 领星API集成 (LingXing API Integration)
- **[如何查看领星API文档](knowledge-base/lingxing-api-documents/how-to-access-lingxing-api-documentation.md)** - 领星（LingXing）跨境电商数据分析平台API文档的访问指南，包括密钥配置、文档导航、使用建议和安全注意事项
- **[领星API新手指引](knowledge-base/lingxing-api-documents/lingxing-api-newbie-guide.md)** - 领星API的完整入门指南，包括基础概念、准备工作、业务接口调用、Token管理和签名生成等核心内容
- **[领星亚马逊市场列表函数实现详解](knowledge-base/lingxing-api-functions/lingxing-amazon-marketplaces-implementation.md)** - lingxingAmazonMarketplaces云函数的完整实现过程，包括API签名算法、云函数适配、配置文件设计和调试验证等关键技术环节

#### 📋 文档规范 (Documentation Standards)
- **[原子化文档原则](./knowledge-base/documentation-standards/atomic-documentation-principles.md)** - 技术文档原子化写作的核心理念和实践方法，通过将复杂流程拆分为独立可复用的文档模块，实现高效的文档管理和知识复用
- **[文档链接路径标准](./knowledge-base/documentation-standards/documentation-link-path-standards.md)** - 文档中链接引用的路径规范和标准，确保链接的正确性和可维护性
- **[README.md 更新要求](./knowledge-base/documentation-standards/readme-update-requirements.md)** - AI助手完成文档创作后必须执行的README.md更新流程，包括目录遍历、大纲树更新、文章描述添加和结构完整性检查
- **[文档更新后README维护指南](./knowledge-base/documentation-standards/document-update-readme-maintenance.md)** - AI助手完成文档更新后必须执行的README维护流程，包括链接有效性检查、描述更新和目录结构维护
- **[README内容同步到项目规则指南](./knowledge-base/documentation-standards/readme-to-project-rules-sync.md)** - 当README内容变化时，如何同步更新project_rules.md的操作指南

### 🚨 错误解决方案 (Error Solutions)
针对具体错误的原子化解决方案

- **[错误解决方案库说明](error-solutions/README.md)** - 错误解决方案库的使用指南和分类说明，包括查找解决方案的方法和创建新解决方案的要求

#### 🚀 部署错误 (Deployment Errors)
- **[AE Source Push Index.meta.json格式错误解决方案](error-solutions/deployment/ae-source-push-index-meta-json-format-error.md)** - 解决ae source push命令执行时index.meta.json文件格式错误导致的部署失败问题

#### 🔧 函数管理错误 (Function Management Errors)
- **[DX_CLI_41053 Token Expire Error解决方案](error-solutions/function-management/dx-cli-41053-token-expire-error.md)** - 解决调试云函数时遇到的Token过期错误，通过重新登录恢复云函数资源访问权限
- **[Index.meta.json Output Required字段黄色警告问题](error-solutions/function-management/index-meta-json-output-required-field-warning.md)** - 解决index.meta.json文件output部分出现"缺少属性required"黄色警告的问题

### 📁 项目文档 (Project Documentation)
项目级别的综合文档，提供整体视图和管理指南

- **[函数目录](../function-directory.md)** - 项目中所有云函数的完整目录，以大纲树形式展示各函数的功能分类、核心作用和调用信息，便于开发者快速定位和使用
