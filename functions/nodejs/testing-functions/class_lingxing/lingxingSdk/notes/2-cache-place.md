## 💾 缓存位置设计方案对比

todo：多个请求同时发现 Token 过期，并发刷新。​解决方案​：加锁（Redis SETNX 或 Redlock）。

### 1. 内存缓存方案

**实现方式：**
```javascript
class MemoryTokenCache {
  constructor() {
    this.tokenStore = new Map();
  }
  
  set(key, token, expireTime) {
    this.tokenStore.set(key, {
      token,
      expireTime,
      createTime: Date.now()
    });
  }
  
  get(key) {
    const cached = this.tokenStore.get(key);
    if (cached && cached.expireTime > Date.now()) {
      return cached.token;
    }
    return null;
  }
}
```

**优势：**
- ✅ **访问速度极快**：直接内存读写，无I/O开销
- ✅ **实现简单**：使用Map或Object即可实现
- ✅ **无外部依赖**：不需要额外的存储服务
- ✅ **成本最低**：无额外的存储成本

**劣势：**
- ❌ **生命周期短**：云函数实例销毁时数据丢失
- ❌ **无法共享**：不同函数实例间无法共享缓存
- ❌ **内存限制**：受云函数内存配额限制
- ❌ **冷启动影响**：每次冷启动都需要重新获取Token

**适用场景：**
- 单次执行时间较长的批量处理任务
- Token使用频率高但持续时间短的场景
- 对成本敏感的轻量级应用

### 2. 文件缓存方案

**实现方式：**
```javascript
const fs = require('fs').promises;
const path = require('path');

class FileTokenCache {
  constructor(cacheDir = '/tmp/token_cache') {
    this.cacheDir = cacheDir;
  }
  
  async set(key, token, expireTime) {
    const cacheFile = path.join(this.cacheDir, `${key}.json`);
    const data = {
      token,
      expireTime,
      createTime: Date.now()
    };
    await fs.writeFile(cacheFile, JSON.stringify(data));
  }
  
  async get(key) {
    try {
      const cacheFile = path.join(this.cacheDir, `${key}.json`);
      const data = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
      if (data.expireTime > Date.now()) {
        return data.token;
      }
    } catch (error) {
      // 文件不存在或读取失败
    }
    return null;
  }
}
```

**优势：**
- ✅ **持久化存储**：函数实例销毁后数据仍然保留
- ✅ **实现相对简单**：使用文件系统API即可
- ✅ **无外部依赖**：不需要额外的存储服务
- ✅ **成本较低**：只使用临时存储空间

**劣势：**
- ❌ **I/O开销**：文件读写比内存访问慢
- ❌ **并发问题**：多个实例同时读写可能冲突
- ❌ **存储限制**：受云函数临时存储空间限制
- ❌ **清理复杂**：需要手动清理过期文件

**适用场景：**
- Token有效期较长（几小时到几天）
- 函数调用频率中等的场景
- 需要在函数重启后保持Token的场景

### 3. Redis缓存方案

**实现方式：**
```javascript
const Redis = require('ioredis');

class RedisTokenCache {
  constructor(redisConfig) {
    this.redis = new Redis(redisConfig);
  }
  
  async set(key, token, expireTime) {
    const ttl = Math.floor((expireTime - Date.now()) / 1000);
    await this.redis.setex(`token:${key}`, ttl, JSON.stringify({
      token,
      expireTime,
      createTime: Date.now()
    }));
  }
  
  async get(key) {
    const cached = await this.redis.get(`token:${key}`);
    if (cached) {
      const data = JSON.parse(cached);
      return data.token;
    }
    return null;
  }
}
```

**优势：**
- ✅ **高性能**：内存数据库，访问速度快
- ✅ **多实例共享**：所有函数实例可共享同一缓存
- ✅ **自动过期**：支持TTL自动清理过期数据
- ✅ **高可用性**：支持主从复制和集群模式
- ✅ **丰富功能**：支持分布式锁、发布订阅等

**劣势：**
- ❌ **额外成本**：需要维护Redis实例
- ❌ **网络延迟**：需要网络请求访问Redis
- ❌ **复杂性增加**：需要处理连接管理和错误恢复
- ❌ **外部依赖**：增加了系统的复杂度

**适用场景：**
- 高并发、多实例的生产环境
- Token需要在多个服务间共享
- 对缓存性能和可靠性要求较高的场景

### 4. 数据库缓存方案

**实现方式：**
```javascript
class DatabaseTokenCache {
  constructor(dbConnection) {
    this.db = dbConnection;
  }
  
  async set(key, token, expireTime) {
    await this.db.query(`
      INSERT INTO token_cache (cache_key, token_data, expire_time, create_time)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      token_data = VALUES(token_data),
      expire_time = VALUES(expire_time),
      create_time = VALUES(create_time)
    `, [key, JSON.stringify({token}), new Date(expireTime), new Date()]);
  }
  
  async get(key) {
    const result = await this.db.query(`
      SELECT token_data FROM token_cache
      WHERE cache_key = ? AND expire_time > NOW()
    `, [key]);
    
    if (result.length > 0) {
      const data = JSON.parse(result[0].token_data);
      return data.token;
    }
    return null;
  }
}
```

**优势：**
- ✅ **持久化可靠**：数据持久化存储，不会丢失
- ✅ **事务支持**：支持ACID事务特性
- ✅ **查询灵活**：支持复杂查询和统计
- ✅ **数据一致性**：强一致性保证
- ✅ **备份恢复**：完善的备份和恢复机制

**劣势：**
- ❌ **性能较低**：相比内存缓存访问速度慢
- ❌ **成本较高**：需要维护数据库实例
- ❌ **复杂度高**：需要设计表结构和索引
- ❌ **过度设计**：对于简单的Token缓存可能过于复杂

**适用场景：**
- 需要长期存储Token历史记录
- 对数据一致性要求极高的场景
- 已有数据库基础设施的企业环境

### 5. 云存储缓存方案

**实现方式：**
```javascript
class CloudStorageTokenCache {
  constructor(storageClient) {
    this.storage = storageClient;
    this.bucketName = 'token-cache-bucket';
  }
  
  async set(key, token, expireTime) {
    const data = {
      token,
      expireTime,
      createTime: Date.now()
    };
    
    await this.storage.upload({
      Bucket: this.bucketName,
      Key: `tokens/${key}.json`,
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    });
  }
  
  async get(key) {
    try {
      const result = await this.storage.download({
        Bucket: this.bucketName,
        Key: `tokens/${key}.json`
      });
      
      const data = JSON.parse(result.Body.toString());
      if (data.expireTime > Date.now()) {
        return data.token;
      }
    } catch (error) {
      // 文件不存在或读取失败
    }
    return null;
  }
}
```

**优势：**
- ✅ **无限容量**：几乎无存储容量限制
- ✅ **高可用性**：云服务商提供高可用保证
- ✅ **成本可控**：按使用量付费
- ✅ **全球分布**：支持多地域部署

**劣势：**
- ❌ **访问延迟**：网络请求延迟较高
- ❌ **API限制**：受云服务API调用频率限制
- ❌ **成本累积**：频繁访问成本可能较高
- ❌ **复杂性**：需要处理云服务的认证和错误

**适用场景：**
- 需要跨地域共享Token的分布式系统
- 对存储容量有较大需求的场景
- 已深度使用云服务的环境

## 📊 缓存方案综合对比

| 对比维度 | 内存缓存 | 文件缓存 | Redis缓存 | 数据库缓存 | 云存储缓存 |
|---------|---------|---------|-----------|-----------|-----------|
| **访问速度** | 极快 | 快 | 快 | 中等 | 慢 |
| **持久化** | 无 | 有限 | 有 | 强 | 强 |
| **多实例共享** | 否 | 否 | 是 | 是 | 是 |
| **实现复杂度** | 低 | 低 | 中 | 高 | 中 |
| **运维成本** | 无 | 无 | 中 | 高 | 低 |
| **扩展性** | 差 | 差 | 好 | 好 | 极好 |
| **成本** | 最低 | 低 | 中 | 高 | 中 |
| **可靠性** | 低 | 中 | 高 | 极高 | 高 |

## 🎯 推荐缓存策略

### 场景一：开发测试环境
**推荐方案：内存缓存**
- 实现简单，无额外依赖
- 成本最低，适合快速迭代
- 性能最优，便于调试

### 场景二：小规模生产环境
**推荐方案：文件缓存 + 内存缓存组合**
```javascript
class HybridTokenCache {
  constructor() {
    this.memoryCache = new MemoryTokenCache();
    this.fileCache = new FileTokenCache();
  }
  
  async get(key) {
    // 先查内存缓存
    let token = this.memoryCache.get(key);
    if (token) return token;
    
    // 再查文件缓存
    token = await this.fileCache.get(key);
    if (token) {
      // 回写到内存缓存
      this.memoryCache.set(key, token, expireTime);
      return token;
    }
    
    return null;
  }
}
```

### 场景三：大规模生产环境
**推荐方案：Redis缓存**
- 高性能，支持多实例共享
- 自动过期，运维简单
- 成熟稳定，生态丰富

### 场景四：企业级应用
**推荐方案：Redis + 数据库双层缓存**
- Redis作为热缓存，提供高性能访问
- 数据库作为冷存储，保证数据可靠性
- 实现缓存降级和故障恢复机制
