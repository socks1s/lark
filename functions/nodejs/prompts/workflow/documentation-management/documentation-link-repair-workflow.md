# Documentation Link Repair Workflow

## 📝 概述

技术文档中失效链接的系统性修复工作流程，专注于将绝对路径转换为相对路径，确保文档的可移植性和跨环境兼容性。

## 🔗 前置知识

- [AI Documentation Writing Workflow](./ai-documentation-writing-workflow.md) - AI 文档写作工作流程指南

## 🎯 修复目标

将所有绝对路径、用户系统路径和不完整项目路径转换为相对路径格式：

**转换规则**：
- 同级目录：`./filename.md`
- 上级目录：`../directory/filename.md`
- 下级目录：`./subdirectory/filename.md`

## 🔄 修复工作流程

### 第一阶段：发现问题链接

使用AI工具搜索问题链接：
1. `search_by_regex` 搜索：`\[.*\]\(/[^)]*\)`
2. `search_codebase` 查找："/package_facdb4__c/" 或 "/Users/"

**识别类型**：
- 绝对路径：`/package_facdb4__c/...`
- 用户路径：`/Users/username/...`
- 不完整路径：`/functions/nodejs/...`

### 第二阶段：批量修复

**修复顺序**：知识库文档 → 工作流程文档 → 索引文档

**路径转换示例**：
```
/package_facdb4__c/functions/nodejs/prompts/knowledge-base/function-management/how-to-find-function-apiname.md
↓
../knowledge-base/function-management/how-to-find-function-apiname.md
```

**推荐工具**：`update_file` - 精确替换，保持其他内容不变

### 第三阶段：验证修复

**检查要点**：
- [ ] 使用相对路径格式（`./`、`../`）
- [ ] 无绝对路径（以 `/` 开头）
- [ ] 目标文件确实存在
- [ ] 无遗漏链接

## 🛠️ 修复案例

**修复前**：
```markdown
[如何创建唯一函数名](../../knowledge-base/function-management/how-to-create-unique-function-name.md)
```

**修复后**：
```markdown
[如何创建唯一函数名](../../knowledge-base/function-management/how-to-create-unique-function-name.md)
```
