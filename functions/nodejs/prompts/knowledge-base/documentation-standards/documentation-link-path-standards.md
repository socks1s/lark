# Documentation Link Path Standards

## 概述

规定技术文档中链接引用的路径标准，确保文档链接的一致性、可维护性和跨环境兼容性。

## 🎯 核心原则

**必须使用**：相对于当前文档的相对路径
**严格禁止**：绝对路径、用户系统路径、不完整项目路径

## 📋 路径格式规范

### ✅ 正确格式
```markdown
# 标准格式：相对路径
[云函数的基本组成与目录结构](../function-management/cloud-function-basic-structure-and-directory.md)
[AI文档写作工作流程](../testing/debug-param-json-guide.md)
```

### ❌ 禁止格式
```markdown
# 绝对路径
[文档](../function-management/cloud-function-basic-structure-and-directory.md)
[文档](/package_facdb4__c/functions/nodejs/prompts/...)

# 用户系统路径
[文档](/Users/username/Documents/...)
[文档](../../../../../docs/guides/aa/aaas/a.md)

# 不完整项目路径
[文档](/functions/nodejs/prompts/...)
[文档](/prompts/knowledge-base/...)
```

## 🏗️ 路径构建规则

- 同级目录：`./filename.md`
- 上级目录：`../directory/filename.md`
- 下级目录：`./subdirectory/filename.md`

## 🔧 验证与检查

### 路径检查清单
- [ ] 路径使用相对路径格式（`./`、`../`）
- [ ] 不包含绝对路径（以 `/` 开头）
- [ ] 不包含用户系统路径
- [ ] 文件扩展名正确（`.md`）

### 错误检测方法

#### 命令行检测
```bash
# 检查绝对路径
grep -r "\[.*\](/.*)" *.md

# 检查用户路径
grep -r "/Users/\|C:\\\\" *.md
```

#### AI辅助检测工作流程
1. 使用 `search_by_regex` 工具搜索：`\[.*\]\(/[^)]*\)`
2. 使用 `search_codebase` 工具查找关键词："/package_facdb4__c/" 或 "/Users/"
3. 使用 `view_files` 工具查看具体文件内容并修复

## 📚 最佳实践

- 从创建开始就使用正确的相对路径格式
- 定期检查和更新失效链接
- 移动文档时注意更新相关的相对路径引用

## 总结

**核心要点**：始终使用相对于当前文档的相对路径，确保文档链接的可移植性和维护性，避免绝对路径和用户系统路径。