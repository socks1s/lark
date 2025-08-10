# 函数目录更新指南

## 概述

本指南说明如何将 `/functions/nodejs` 文件夹下的函数录入到 `function-directory.md` 目录文档中。

## 更新流程

### 1. 收集函数信息

从函数的 `index.meta.json` 文件中提取：
- **ApiName**: 函数API名称
- **Label**: 函数显示标签  
- **Description**: 功能描述
- **位置**: 函数相对路径

### 2. 确定分类

将函数归类到现有分类：
- 📊 数据比较与分析类
- 🔄 数据增删改查类  
- 📝 记录创建编辑类
- 🔄 版本控制类
- 📊 测试数据获取类
- 🛠️ 工具函数类

### 3. 录入函数目录

在 `function-directory.md` 相应分类下添加函数条目：

```markdown
#### `函数ApiName` - 函数标签
- **功能**: 功能描述
- **特点**: 特色功能
- **位置**: `modules/函数路径/`
- **ApiName**: `函数ApiName`
```

### 4. 更新统计信息

更新文档末尾的统计数据：
- 总函数数量
- 各分类函数数量

## 快速操作步骤

1. 找到函数的 `index.meta.json` 文件
2. 提取 apiName、label、description 信息
3. 确定函数所属分类
4. 在 `function-directory.md` 对应分类下添加条目
5. 更新统计信息