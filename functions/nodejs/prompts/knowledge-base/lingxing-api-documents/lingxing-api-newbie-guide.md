# 领星API新手指引

## 📚 概述

领星（LingXing）是一个专业的跨境电商数据分析平台，为开发者提供了丰富的API接口用于数据获取和业务集成。本指引将帮助新手开发者快速上手领星API的使用，从基础概念到实际应用，提供全面的入门指导。

## 🔑 API文档访问

### 文档地址
- **主要文档地址**：`https://apidoc.lingxing.com/#/`
- **新手指引页面**：`https://apidoc.lingxing.com/#/docs/Guidance/newInstructions`
- **API请求域名**：`https://openapi.lingxing.com`

### 访问密钥
- **文档查看密钥**：`M1zdQPoaMg`

### 访问步骤
1. 在浏览器中访问文档地址
2. 如果页面提示需要密钥，在输入框中输入访问密钥
3. 验证成功后即可查看完整的API文档内容

## 🛠️ 准备工作

### 1.1 申请AppId和AppSecret

接入领星API公共服务前须先申请AppId和AppSecret，这两个参数是生成调用领星功能接口凭证token的必须参数，客户需要妥善保管。

**申请步骤：**
1. 登录领星ERP系统
2. 进入API管理页面
3. 按照流程申请企业的AppId和AppSecret
4. 妥善保存获取到的凭证信息

**注意事项：**
- AppId和AppSecret是敏感信息，请勿泄露
- 建议定期更换密钥以确保安全性
- 在代码中使用环境变量存储这些凭证

### 1.2 配置IP白名单

除申请AppId和AppSecret外，还需添加允许访问的外网IP白名单，二者缺一不可。

**配置步骤：**
1. 获取服务器的外网IP地址
2. 登录领星ERP系统的API管理页面
3. 在IP白名单配置中添加允许访问的IP地址
4. 保存配置并等待生效

**重要提醒：**
- 只有白名单中的IP地址才能成功调用API
- 如果服务器IP发生变化，需要及时更新白名单
- 建议使用固定IP或配置多个备用IP

## 🚀 业务接口调用

### 2.1 公共请求参数

所有API接口调用都需要包含以下公共请求参数：

| 参数名 | 类型 | 描述 | 数据来源 |
|--------|------|------|----------|
| access_token | string | 通过接口获取的token信息 | access_token获取接口 |
| app_key | string | 企业Id | API信息的查询与配置 |
| timestamp | string | 时间戳 | 例：1720408272 |
| sign | string | 接口签名 | 签名sign的生成 |

**重要提醒：**
- 如果没有传递完整的公共请求参数，会出现"公共请求参数不完整"的错误
- sign作为参数在传输时需要进行URL编码（url encode）以确保能够正常传递并被正确处理

### 2.2 GET类型请求

业务请求参数和公共请求参数都拼接在URL上面。

**请求格式：**
```
https://openapi.lingxing.com/xxx/xxx/xxx?access_token=xxx&app_key=xxx&timestamp=xxx&sign=xxx&业务参数1=值1&业务参数2=值2
```

**示例：**
发送业务参数为`offset=0,length=100`的GET请求：

```bash
curl --location --max-time 30000 'https://openapi.lingxing.com/xxx/xxx/xxx?access_token=44fa2eed-xxxx-xxxx-xxxx-8c6abe5ea6a4&app_key=ak_xxxxxxxxxS&timestamp=1720429074&sign=NaUK5YE68tgyVz%2FheN8WqPvL%2F4zTp1zK7%2BX0H8iogzRNvt1hHQkYGvkzsZ%2B0e8VP&offset=0&length=100'
```

### 2.3 POST类型请求

业务请求参数放入body（JSON格式），公共请求参数拼接在URL上。

**注意事项：**
- body参数中若嵌套有集合需要转成string参与签名，否则会出现生成签名不正确的问题
- 接口文档无特殊说明的，body内参数均以JSON格式传输
- header中需要设置 `Content-type: application/json`

**示例：**
发送业务参数为`{"name": "kobe", "content": { "city": "lake", "age": "133" }}`的POST请求：

```bash
curl --location --max-time 30000 'https://openapi.lingxing.com/xxx/xxx/xxx?access_token=xxx&app_key=xxx&timestamp=xxx&sign=xxx' \
--header 'Content-Type: application/json' \
--data '{
    "name": "kobe",
    "content": {
        "city": "lake",
        "age": "133"
    }
}'
```

## 🔐 Access Token获取及续约

### 3.1 Access Token获取

access_token是领星API调用的凭证，调用各业务接口时都需使用access_token，开发者需要进行妥善保存。

**获取步骤：**
1. 准备AppId和AppSecret
2. 调用获取接口令牌API
3. 解析响应获取access_token和refresh_token
4. 妥善保存token信息

**请求示例：**
```bash
curl --location --max-time 30000 'https://openapi.lingxing.com/api/auth-server/oauth/access-token' \
--header 'Content-Type: application/json' \
--data '{
    "appId": "your_app_id",
    "appSecret": "your_app_secret"
}'
```

**响应示例：**
```json
{
    "code": "200",
    "msg": "OK",
    "data": {
        "access_token": "44fa2eed-xxxx-xxxx-xxxx-8c6abe5ea6a4",
        "refresh_token": "refresh_token_value",
        "expires_in": 7200
    }
}
```

### 3.2 Access Token续约

如果不想生成新的token，可以根据appId和access_token续约access_token。在access_token到期前调用续约接口，每次调用都会生成新的refresh_token。

**重要注意事项：**
- refresh_token的有效期为2个小时
- 一个refresh_token只能被使用一次给access_token续约
- 如果需要再次续约，需要使用上次续约返回的refresh_token

**续约请求示例：**
```bash
curl --location --max-time 30000 'https://openapi.lingxing.com/api/auth-server/oauth/refresh-token' \
--header 'Content-Type: application/json' \
--data '{
    "appId": "your_app_id",
    "refresh_token": "your_refresh_token"
}'
```

## 🔐 签名Sign的生成

### 4.1 Sign生成规则

签名生成是API调用安全性的重要保障，请严格按照以下步骤生成：

**步骤详解：**

**a) 参数排序**
- 请求包含的所有参数使用ASCII排序
- 包括：所有业务请求入参 + 3个固定参数（access_token、app_key、timestamp）

**b) 参数拼接**
- 以 `key1=value1&key2=value2&...&keyn=valuen` 的格式拼接
- key为参数键，value为参数值
- **重要：value为空不参与生成签名！（value为null会参与生成签名）**

**c) MD5加密**
- 拼接后的字符串用MD5(32位)加密后转大写

**d) AES加密**
- 用AES/ECB/PKCS5PADDING对生成的MD5值加密
- AES加密的密钥为appId
- 采用ECB模式，填充方式为PKCS5PADDING

**重要注意事项：**

1. **URL编码**：sign作为参数在传输时需要进行URL编码（url encode），以确保能够正常接收处理

2. **时效性**：当timestamp以固定值参与签名生成sign时，sign的有效期为2分钟，2分钟后签名过期。建议调用业务接口时使用实时的时间戳生成签名sign，不要缓存sign

3. **文件上传**：当有文件上传需要生成签名时，需要文件原始名作为key，文件md5加密的值为value。key不要使用汉字，key=originFileName，value=DigestUtils.md5Hex(InputStream())

### 4.2 最佳实践

建议下载相应语言的SDK文件，以Java语言为例：

```java
public static void main(String[] args) throws Exception {
    String appId = "xxx";

    Map<String, Object> queryParam = new HashMap<>();
    queryParam.put("timestamp", 1639734344);
    queryParam.put("access_token", "59cf5437-669b-49f5-83c4-3cc1d1404680");
    queryParam.put("app_key", appId);

    String sign = ApiSign.sign(queryParam, appId);
    queryParam.put("sign", sign);
    log.info("sign:{}", sign);

    HttpRequest<Object> build = HttpRequest.builder(Object.class)
            .method(HttpMethod.GET)
            .endpoint("xxxx")
            .path("erp/sc/data/local_inventory/brand")
            .queryParams(queryParam)
            .build();
    HttpResponse execute = HttpExecutor.create().execute(build);
    log.info("execute:{}", execute.readEntity(Object.class));
}
```

## 🚦 限流算法说明

领星API采用改进的令牌桶算法进行流量控制：

### 5.1 算法原理

- **令牌提供**：为每一个请求提供一个令牌
- **令牌消耗**：当请求到达时，如果桶中有足够的令牌，则会消耗一个令牌并允许请求通过
- **限流处理**：如果没有令牌，则请求被限流（错误码：3001008）
- **令牌回收**：基于请求完成、异常、超时（2分钟）
- **限流维度**：appId + 接口url

### 5.2 限流策略

```
请求 → 令牌桶检查 → 有令牌？ → 是 → 消耗令牌 → 处理请求
                    ↓
                   否
                    ↓
                返回限流错误(3001008)
```

**建议：**
- 合理控制请求频率
- 实现请求重试机制
- 监控限流错误并及时调整

## 📦 SDK下载

领星提供多种编程语言的SDK，方便开发者快速集成：

### 6.1 支持的编程语言

- **Go** - 适用于高性能后端服务
- **PHP** - 适用于Web应用开发
- **Java** - 适用于企业级应用
- **Node.js** - 适用于JavaScript/TypeScript项目
- **Python** - 适用于数据分析和自动化脚本

### 6.2 SDK优势

- ✅ **自动签名生成** - 无需手动实现复杂的签名算法
- ✅ **令牌管理** - 自动处理token获取和续约
- ✅ **错误处理** - 统一的错误处理机制
- ✅ **请求重试** - 内置重试机制提高稳定性
- ✅ **类型安全** - 提供完整的类型定义

### 6.3 获取方式

请联系领星技术支持获取对应语言的SDK包，或访问官方文档下载页面。

## 📋 常用API模块

### 8.1 订单管理（Order Management）
- **获取订单列表** - 支持多条件筛选和分页查询
- **查询订单详情** - 获取订单完整信息
- **更新订单状态** - 订单状态流转管理
- **订单发货** - 物流信息更新

### 8.2 库存管理（Inventory Management）
- **查询库存信息** - 实时库存数据获取
- **更新库存数量** - 库存增减操作
- **库存预警设置** - 低库存提醒配置
- **库存调拨** - 仓库间库存转移

### 8.3 商品管理（Product Management）
- **商品信息查询** - 商品基础信息获取
- **商品上架管理** - 商品状态控制
- **商品分类操作** - 分类层级管理
- **价格管理** - 商品定价策略

### 8.4 基础数据（Basic Data）
- **市场平台数据** - 获取支持的电商平台信息
- **店铺信息** - 获取关联的店铺数据
- **产品信息** - 获取产品和SKU数据
- **汇率信息** - 实时汇率数据获取

### 8.5 财务管理（Finance Management）
- **收支明细查询** - 财务流水记录
- **对账单生成** - 定期财务报表
- **费用统计** - 各类费用分析
- **利润分析** - 盈利能力评估

## 📋 开发最佳实践

### 1. 错误处理

```javascript
try {
  const result = await callLingxingAPI(params);
  if (result.code === '200') {
    // 处理成功响应
    return result.data;
  } else {
    // 处理业务错误
    throw new Error(`API错误: ${result.msg}`);
  }
} catch (error) {
  // 处理网络或其他异常
  console.error('API调用失败:', error.message);
}
```

### 2. 分页处理

对于返回大量数据的接口，建议使用分页查询：

```javascript
const fetchAllData = async (accessToken) => {
  let allData = [];
  let pageNum = 1;
  const pageSize = 50;
  
  while (true) {
    const result = await fetchPageData(accessToken, pageNum, pageSize);
    allData = allData.concat(result.data);
    
    if (result.data.length < pageSize) {
      break; // 已获取所有数据
    }
    pageNum++;
  }
  
  return allData;
};
```

### 3. 请求频率控制

为避免触发API限流，建议：
- 控制请求频率，避免过于频繁的调用
- 实现重试机制处理临时性错误
- 使用批量接口减少请求次数

### 4. 数据缓存

对于变化不频繁的基础数据，建议实现本地缓存：
- 缓存访问令牌（注意过期时间）
- 缓存基础配置数据
- 定期更新缓存数据

## 🔧 推荐工具

### 9.1 API测试工具
- **Postman** - 功能强大的API测试平台，支持环境变量和自动化测试
- **Insomnia** - 轻量级REST客户端，界面简洁易用
- **curl** - 命令行HTTP工具，适合脚本化测试
- **Swagger UI** - 在线API文档和测试工具

### 9.2 开发环境
- **Visual Studio Code** - 推荐的代码编辑器，丰富的插件生态
- **Node.js** - JavaScript运行环境，适合快速原型开发
- **Git** - 版本控制工具，代码管理必备
- **Docker** - 容器化部署，环境一致性保障

### 9.3 监控和调试
- **日志系统** - 建议集成完善的日志记录
- **性能监控** - 监控API调用性能和成功率
- **错误追踪** - 及时发现和处理异常情况

## 📞 技术支持

### 10.1 获取帮助的方式

如果您在使用过程中遇到问题，可以通过以下方式获取帮助：

- 📧 **邮件支持**：api-support@lingxing.com
- 📱 **在线客服**：登录领星ERP系统联系客服
- 📚 **官方文档**：https://apidoc.lingxing.com
- 💬 **开发者社区**：加入领星开发者交流群

### 10.2 常见问题处理

- **签名错误**：检查参数排序和加密步骤
- **Token过期**：及时续约或重新获取
- **限流问题**：控制请求频率，实现重试机制
- **404错误**：确认API路径和版本正确性

## 📋 总结

通过本指南，您应该已经掌握了：

✅ **基础准备** - AppId/AppSecret申请和IP白名单配置  
✅ **接口调用** - GET/POST请求的标准格式  
✅ **身份认证** - Access Token的获取和续约  
✅ **安全签名** - Sign生成的完整流程  
✅ **限流处理** - 令牌桶算法的应对策略  
✅ **SDK使用** - 多语言SDK的选择和应用  
✅ **最佳实践** - 错误处理和性能优化  

现在您可以开始集成领星API，构建强大的电商管理应用了！

---

*本指南基于领星API最新版本编写，将持续更新。如有疑问或建议，欢迎反馈。*