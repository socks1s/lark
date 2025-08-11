# GitHub推送完整指南

## 📝 概述

本文档详细记录了将飞书低代码项目推送到GitHub的完整流程，包括初始化、冲突解决、认证配置、仓库管理等所有关键步骤。基于实际操作经验总结，提供了完整的问题解决方案和最佳实践。

## ⚠️ 必读前置知识

### 1. Git基础操作知识
- **为什么必读**：确保理解Git版本控制的基本概念和命令
- **核心概念**：仓库、分支、提交、推送、拉取、合并、冲突解决

### 2. GitHub仓库管理
- **为什么必读**：了解GitHub平台的仓库创建、删除和管理操作
- **核心操作**：创建仓库、删除仓库、设置仓库权限

## 🔄 完整推送流程

### 第一阶段：本地仓库初始化

#### 1.1 检查Git状态
```bash
git status
```
**目的**：确认当前仓库状态，检查是否有未提交的更改

#### 1.2 添加远程仓库
```bash
git remote add origin https://github.com/用户名/仓库名.git
```
**注意事项**：
- 确保GitHub仓库已创建
- 使用正确的用户名和仓库名
- 如果已存在远程仓库，使用 `git remote remove origin` 先删除

### 第二阶段：推送前准备

#### 2.1 配置Git用户信息
```bash
# 设置全局用户名
git config --global user.name "你的用户名"

# 设置全局邮箱
git config --global user.email "你的邮箱"

# 验证配置
git config --global user.name
git config --global user.email
```

#### 2.2 检查提交历史
```bash
# 查看提交历史
git log --oneline -5

# 查看提交作者信息
git log --oneline -5 --pretty=format:"%h %an <%ae> %s"
```

### 第三阶段：处理推送冲突

#### 3.1 首次推送尝试
```bash
git push -u origin main
```

#### 3.2 处理推送被拒绝的情况

**常见错误**：`Updates were rejected because the tip of your current branch is behind`

**解决方案1：拉取并合并**
```bash
# 查看远程分支差异
git log --oneline HEAD..origin/main

# 拉取远程更改
git pull origin main
```

**解决方案2：使用rebase**
```bash
git pull --rebase origin main
```

#### 3.3 解决合并冲突

**识别冲突文件**：
```bash
git status
```

**手动解决冲突**：
1. 打开冲突文件
2. 查找冲突标记：`<<<<<<<`、`=======`、`>>>>>>>`
3. 手动编辑，保留需要的内容
4. 删除冲突标记

**标记冲突已解决**：
```bash
git add 冲突文件名
```

**继续rebase**：
```bash
git rebase --continue
```

### 第四阶段：提交和推送

#### 4.1 提交更改
```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "提交信息"
```

#### 4.2 推送到远程仓库
```bash
# 普通推送
git push origin main

# 强制推送（谨慎使用）
git push --force origin main
```

## 🔧 常见问题解决方案

### 问题1：远程仓库不存在
**错误信息**：`remote repository not found`

**解决方案**：
1. 确认GitHub仓库已创建
2. 检查仓库URL是否正确
3. 验证用户名和仓库名拼写

### 问题2：认证失败
**错误信息**：`Authentication failed`

**解决方案**：
1. 检查GitHub用户名和密码
2. 使用Personal Access Token替代密码
3. 配置SSH密钥认证

### 问题3：合并冲突
**错误信息**：`Merge conflict in 文件名`

**解决步骤**：
1. 使用 `git status` 查看冲突文件
2. 手动编辑冲突文件，解决冲突
3. 使用 `git add 文件名` 标记已解决
4. 继续合并或rebase操作

### 问题4：提交作者信息错误
**问题描述**：推送后GitHub显示错误的作者信息

**解决方案**：
```bash
# 修改最后一次提交的作者信息
git commit --amend --author="新用户名 <新邮箱>" --no-edit

# 强制推送更新
git push --force origin main
```

## 🗂️ 仓库管理最佳实践

### 1. 仓库重建流程

**场景**：需要删除旧仓库，创建新仓库

**步骤**：
1. 在GitHub上删除旧仓库
2. 创建新仓库（不要初始化README）
3. 更新本地远程仓库配置
4. 推送本地代码

### 2. .gitignore配置

**重要文件排除**：
```gitignore
# 飞书低代码配置
.ae

# Node.js依赖
node_modules/

# 系统文件
.DS_Store
Thumbs.db

# IDE文件
.vscode/
.idea/

# 日志文件
*.log

# 临时文件
*.tmp
*.temp
```

### 3. 分支管理策略

**主分支保护**：
- `main` 分支用于稳定版本
- 开发工作在 `develop` 分支进行
- 功能开发使用 `feature/功能名` 分支

## 🛡️ 安全注意事项

### 1. 敏感信息保护

**绝对不能推送的内容**：
- API密钥和访问令牌
- 数据库连接字符串
- 私钥文件
- 用户密码

**保护措施**：
- 使用 `.gitignore` 排除敏感文件
- 使用环境变量存储敏感配置
- 定期检查提交历史中的敏感信息

### 2. 提交信息规范

**良好的提交信息格式**：
```
类型(范围): 简短描述

详细描述（可选）

相关问题编号（可选）
```

**示例**：
```
feat(auth): 添加用户认证功能

实现了基于JWT的用户认证系统，包括登录、注册和权限验证

Closes #123
```

## 📋 操作检查清单

### 推送前检查
- [ ] Git用户信息已正确配置
- [ ] 敏感文件已添加到 `.gitignore`
- [ ] 所有更改已提交到本地仓库
- [ ] 远程仓库已创建且URL正确

### 推送过程检查
- [ ] 远程仓库连接成功
- [ ] 冲突已正确解决
- [ ] 提交作者信息正确
- [ ] 推送操作成功完成

### 推送后验证
- [ ] GitHub仓库显示最新代码
- [ ] 提交历史完整且正确
- [ ] 作者信息显示正确
- [ ] 敏感信息未泄露

## 💡 最佳实践总结

### 1. 推送频率
- **小步快跑**：频繁提交小的更改
- **功能完整**：确保每次推送的功能相对完整
- **测试验证**：推送前进行基本的功能测试

### 2. 冲突预防
- **及时同步**：定期拉取远程更改
- **分支隔离**：使用分支进行功能开发
- **沟通协调**：团队开发时加强沟通

### 3. 历史管理
- **清晰提交**：编写清晰的提交信息
- **逻辑分组**：相关更改放在同一次提交中
- **避免垃圾提交**：避免"修复typo"等无意义提交

## 🔗 相关参考文档

- [AE Source Push工作流程](./ae-source-push-workflow.md) - 飞书低代码平台的源代码推送流程
- [文档链接路径标准](../../knowledge-base/documentation-standards/documentation-link-path-standards.md) - 文档中链接的规范格式

## 📞 故障排除 

### 获取帮助的方式
1. **查看Git日志**：使用 `git log` 查看详细的操作历史
2. **检查远程状态**：使用 `git remote -v` 确认远程仓库配置
3. **重置到已知状态**：必要时使用 `git reset` 回退到稳定状态
4. **寻求技术支持**：在GitHub社区或相关技术论坛寻求帮助

### 紧急恢复方案
如果推送过程中出现严重问题：

1. **备份当前状态**：
   ```bash
   git stash
   git branch backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **重置到安全状态**：
   ```bash
   git reset --hard HEAD~1
   ```

3. **重新开始推送流程**：
   按照本文档重新执行推送操作

## 📈 进阶技巧

### 1. 使用SSH认证
```bash
# 生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 添加到GitHub账户
# 复制公钥内容到GitHub Settings > SSH Keys

# 测试连接
ssh -T git@github.com
```

### 2. 配置Git别名
```bash
# 常用命令别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
```

### 3. 使用Git钩子
创建 `.git/hooks/pre-commit` 文件，实现推送前自动检查：
```bash
#!/bin/sh
# 检查是否包含敏感信息
if grep -r "password\|secret\|key" --exclude-dir=.git .; then
    echo "警告：发现可能的敏感信息"
    exit 1
fi
```

通过遵循本指南，你可以安全、高效地将项目推送到GitHub，并处理推送过程中可能遇到的各种问题。