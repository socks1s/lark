# 错误处理机制 (Error Handling)

## 📝 概述

错误处理机制是整个数据验算系统的重要组成部分，负责统一处理各个模块中可能出现的异常情况，确保系统的稳定性和可靠性。

## 🎯 设计目标

- **统一处理**：为所有模块提供统一的错误处理机制
- **分类管理**：按错误来源和严重程度进行分类管理
- **优雅降级**：在部分功能失败时提供降级服务
- **详细信息**：提供详细的错误信息和恢复建议
- **错误恢复**：支持自动重试和错误恢复策略

## 📋 输入输出参数简述

### 输入参数
- **error**: 原始错误对象（来自各个模块）
- **context**: 错误上下文信息（模块名、操作类型、请求ID等）
- **errorConfig**: 错误处理配置（重试策略、降级规则等）

### 输出参数
- **标准化错误对象**: 包含错误代码、消息、详细信息和恢复建议
- **处理结果**: 错误处理的执行结果（重试、降级或失败）
- **错误报告**: 用于监控和分析的错误统计信息

## 🏗️ 错误分类体系

### 按错误来源分类

#### 1. 请求处理错误 (RequestHandler Errors)
```javascript
{
  category: "REQUEST_HANDLER",
  errors: {
    INVALID_REQUEST_FORMAT: {
      code: "RH001",
      message: "请求格式无效",
      severity: "HIGH",
      recoverable: false
    },
    MISSING_REQUIRED_FIELD: {
      code: "RH002", 
      message: "缺少必需字段",
      severity: "HIGH",
      recoverable: false
    },
    INVALID_FIELD_TYPE: {
      code: "RH003",
      message: "字段类型无效",
      severity: "MEDIUM",
      recoverable: false
    },
    REQUEST_SIZE_EXCEEDED: {
      code: "RH004",
      message: "请求大小超出限制",
      severity: "HIGH",
      recoverable: false
    },
    VALIDATION_RULES_INVALID: {
      code: "RH005",
      message: "验证规则配置无效",
      severity: "MEDIUM",
      recoverable: true
    }
  }
}
```

#### 2. 数据获取错误 (DataRetriever Errors)
```javascript
{
  category: "DATA_RETRIEVER",
  errors: {
    DATABASE_CONNECTION_FAILED: {
      code: "DR001",
      message: "数据库连接失败",
      severity: "CRITICAL",
      recoverable: true,
      retryable: true
    },
    QUERY_EXECUTION_FAILED: {
      code: "DR002",
      message: "查询执行失败",
      severity: "HIGH",
      recoverable: true,
      retryable: true
    },
    RECORD_NOT_FOUND: {
      code: "DR003",
      message: "记录不存在",
      severity: "MEDIUM",
      recoverable: false
    },
    DATA_INTEGRITY_CHECK_FAILED: {
      code: "DR004",
      message: "数据完整性检查失败",
      severity: "HIGH",
      recoverable: false
    },
    QUERY_TIMEOUT: {
      code: "DR005",
      message: "查询超时",
      severity: "MEDIUM",
      recoverable: true,
      retryable: true
    },
    INSUFFICIENT_PERMISSIONS: {
      code: "DR006",
      message: "数据访问权限不足",
      severity: "HIGH",
      recoverable: false
    }
  }
}
```

#### 3. 计算引擎错误 (CalculationEngine Errors)
```javascript
{
  category: "CALCULATION_ENGINE",
  errors: {
    FORMULA_PARSE_ERROR: {
      code: "CE001",
      message: "公式解析错误",
      severity: "HIGH",
      recoverable: false
    },
    CALCULATION_OVERFLOW: {
      code: "CE002",
      message: "计算结果溢出",
      severity: "MEDIUM",
      recoverable: true
    },
    DIVISION_BY_ZERO: {
      code: "CE003",
      message: "除零错误",
      severity: "MEDIUM",
      recoverable: true
    },
    MISSING_DEPENDENCY_FIELD: {
      code: "CE004",
      message: "缺少依赖字段",
      severity: "HIGH",
      recoverable: false
    },
    CIRCULAR_DEPENDENCY: {
      code: "CE005",
      message: "循环依赖检测",
      severity: "HIGH",
      recoverable: false
    },
    CALCULATION_TIMEOUT: {
      code: "CE006",
      message: "计算超时",
      severity: "MEDIUM",
      recoverable: true,
      retryable: true
    },
    PRECISION_LOSS: {
      code: "CE007",
      message: "精度丢失警告",
      severity: "LOW",
      recoverable: true
    }
  }
}
```

#### 4. 验证对比错误 (ValidationComparator Errors)
```javascript
{
  category: "VALIDATION_COMPARATOR",
  errors: {
    MISSING_CALCULATED_FIELD: {
      code: "VC001",
      message: "计算字段缺失",
      severity: "HIGH",
      recoverable: false
    },
    MISSING_SUBMITTED_FIELD: {
      code: "VC002",
      message: "提交字段缺失",
      severity: "MEDIUM",
      recoverable: true
    },
    INVALID_TOLERANCE_SETTING: {
      code: "VC003",
      message: "容差设置无效",
      severity: "MEDIUM",
      recoverable: true
    },
    VALIDATION_TIMEOUT: {
      code: "VC004",
      message: "验证超时",
      severity: "MEDIUM",
      recoverable: true,
      retryable: true
    },
    DATA_TYPE_MISMATCH: {
      code: "VC005",
      message: "数据类型不匹配",
      severity: "MEDIUM",
      recoverable: true
    }
  }
}
```

#### 5. 纠错处理错误 (ErrorCorrector Errors)
```javascript
{
  category: "ERROR_CORRECTOR",
  errors: {
    MISSING_CALCULATED_VALUE: {
      code: "EC001",
      message: "计算值缺失",
      severity: "HIGH",
      recoverable: false
    },
    CORRECTION_CONFLICT: {
      code: "EC002",
      message: "纠错冲突",
      severity: "MEDIUM",
      recoverable: true
    },
    DATA_STRUCTURE_ERROR: {
      code: "EC003",
      message: "数据结构错误",
      severity: "HIGH",
      recoverable: false
    },
    CORRECTION_TIMEOUT: {
      code: "EC004",
      message: "纠错超时",
      severity: "MEDIUM",
      recoverable: true,
      retryable: true
    },
    VALIDATION_AFTER_CORRECTION_FAILED: {
      code: "EC005",
      message: "纠错后验证失败",
      severity: "HIGH",
      recoverable: true
    }
  }
}
```

#### 6. 结果输出错误 (ResultOutputter Errors)
```javascript
{
  category: "RESULT_OUTPUTTER",
  errors: {
    RESPONSE_BUILD_ERROR: {
      code: "RO001",
      message: "响应构建错误",
      severity: "HIGH",
      recoverable: true
    },
    SERIALIZATION_ERROR: {
      code: "RO002",
      message: "序列化错误",
      severity: "MEDIUM",
      recoverable: true
    },
    LOCALIZATION_ERROR: {
      code: "RO003",
      message: "本地化错误",
      severity: "LOW",
      recoverable: true
    },
    COMPRESSION_ERROR: {
      code: "RO004",
      message: "压缩错误",
      severity: "LOW",
      recoverable: true
    },
    FIELD_FILTERING_ERROR: {
      code: "RO005",
      message: "字段过滤错误",
      severity: "LOW",
      recoverable: true
    }
  }
}
```

### 按严重程度分类

#### CRITICAL (严重)
- 系统级错误，影响整个服务
- 需要立即处理
- 可能需要人工干预

#### HIGH (高)
- 影响当前请求的处理
- 无法继续正常流程
- 需要错误响应

#### MEDIUM (中)
- 部分功能受影响
- 可能有降级方案
- 需要记录和监控

#### LOW (低)
- 轻微影响或警告
- 不影响主要功能
- 仅需记录

## 🔧 错误处理机制

### 1. 统一错误类定义
```javascript
class SystemError extends Error {
  constructor(errorCode, message, details = {}, cause = null) {
    super(message);
    this.name = 'SystemError';
    this.code = errorCode;
    this.details = details;
    this.cause = cause;
    this.timestamp = new Date().toISOString();
    this.module = this.constructor.name;
    this.severity = this.getSeverity(errorCode);
    this.recoverable = this.isRecoverable(errorCode);
    this.retryable = this.isRetryable(errorCode);
  }
  
  getSeverity(errorCode) {
    const errorConfig = ERROR_DEFINITIONS[errorCode];
    return errorConfig?.severity || 'MEDIUM';
  }
  
  isRecoverable(errorCode) {
    const errorConfig = ERROR_DEFINITIONS[errorCode];
    return errorConfig?.recoverable || false;
  }
  
  isRetryable(errorCode) {
    const errorConfig = ERROR_DEFINITIONS[errorCode];
    return errorConfig?.retryable || false;
  }
  
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.cause,
      timestamp: this.timestamp,
      module: this.module,
      severity: this.severity,
      recoverable: this.recoverable,
      retryable: this.retryable,
      stack: this.stack
    };
  }
}
```

### 2. 错误处理中间件
```javascript
class ErrorHandler {
  constructor(config = {}) {
    this.config = {
      enableRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      enableFallback: true,
      logErrors: true,
      ...config
    };
    this.retryAttempts = new Map();
  }
  
  async handleError(error, context = {}) {
    // 错误标准化
    const standardizedError = this.standardizeError(error);
    
    // 记录错误
    if (this.config.logErrors) {
      this.logError(standardizedError, context);
    }
    
    // 错误恢复策略
    if (standardizedError.recoverable) {
      return await this.attemptRecovery(standardizedError, context);
    }
    
    // 降级处理
    if (this.config.enableFallback) {
      return await this.fallbackHandler(standardizedError, context);
    }
    
    // 抛出错误
    throw standardizedError;
  }
  
  standardizeError(error) {
    if (error instanceof SystemError) {
      return error;
    }
    
    // 将普通错误转换为系统错误
    return new SystemError(
      'UNKNOWN_ERROR',
      error.message || '未知错误',
      { originalError: error.toString() },
      error
    );
  }
  
  async attemptRecovery(error, context) {
    const { code } = error;
    const attemptKey = `${code}_${context.requestId}`;
    
    // 检查重试次数
    if (error.retryable && this.config.enableRetry) {
      const attempts = this.retryAttempts.get(attemptKey) || 0;
      
      if (attempts < this.config.maxRetryAttempts) {
        this.retryAttempts.set(attemptKey, attempts + 1);
        
        // 延迟重试
        await this.delay(this.config.retryDelay * Math.pow(2, attempts));
        
        // 执行重试
        return await this.executeRetry(error, context);
      }
    }
    
    // 重试失败，执行其他恢复策略
    return await this.executeRecoveryStrategy(error, context);
  }
  
  async executeRecoveryStrategy(error, context) {
    const recoveryStrategies = {
      'DR001': this.recoverDatabaseConnection,
      'CE006': this.recoverCalculationTimeout,
      'VC004': this.recoverValidationTimeout,
      'EC004': this.recoverCorrectionTimeout
    };
    
    const strategy = recoveryStrategies[error.code];
    if (strategy) {
      return await strategy.call(this, error, context);
    }
    
    throw error;
  }
  
  async fallbackHandler(error, context) {
    const fallbackStrategies = {
      'CALCULATION_ENGINE': this.calculationFallback,
      'VALIDATION_COMPARATOR': this.validationFallback,
      'ERROR_CORRECTOR': this.correctionFallback,
      'RESULT_OUTPUTTER': this.outputFallback
    };
    
    const category = this.getErrorCategory(error.code);
    const strategy = fallbackStrategies[category];
    
    if (strategy) {
      return await strategy.call(this, error, context);
    }
    
    // 默认降级：返回部分结果
    return this.buildPartialResult(error, context);
  }
  
  logError(error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      sessionId: context.sessionId,
      userId: context.userId,
      error: error.toJSON(),
      context: {
        module: context.currentModule,
        stage: context.currentStage,
        inputData: this.sanitizeForLogging(context.inputData)
      }
    };
    
    // 根据严重程度选择日志级别
    switch (error.severity) {
      case 'CRITICAL':
        console.error('[CRITICAL ERROR]', logEntry);
        break;
      case 'HIGH':
        console.error('[HIGH ERROR]', logEntry);
        break;
      case 'MEDIUM':
        console.warn('[MEDIUM ERROR]', logEntry);
        break;
      case 'LOW':
        console.info('[LOW ERROR]', logEntry);
        break;
    }
  }
}
```

### 3. 模块级错误处理
```javascript
// 每个模块的错误处理装饰器
function withErrorHandling(target, propertyName, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args) {
    const context = {
      requestId: this.requestId,
      sessionId: this.sessionId,
      currentModule: this.constructor.name,
      currentStage: propertyName,
      inputData: args[0]
    };
    
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      return await this.errorHandler.handleError(error, context);
    }
  };
  
  return descriptor;
}

// 使用示例
class CalculationEngine {
  @withErrorHandling
  async calculateFields(dataContext, calculationRules) {
    // 计算逻辑
  }
}
```

## 🔄 错误恢复策略

### 1. 数据库连接恢复
```javascript
async recoverDatabaseConnection(error, context) {
  const maxAttempts = 3;
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 重新建立数据库连接
      await this.database.reconnect();
      
      // 重新执行原始操作
      return await context.retryOperation();
    } catch (retryError) {
      if (attempt === maxAttempts) {
        throw new SystemError(
          'DR001',
          '数据库连接恢复失败',
          { attempts: maxAttempts, lastError: retryError.message }
        );
      }
      
      // 指数退避
      await this.delay(baseDelay * Math.pow(2, attempt - 1));
    }
  }
}
```

### 2. 计算超时恢复
```javascript
async recoverCalculationTimeout(error, context) {
  // 尝试简化计算
  const simplifiedRules = this.simplifyCalculationRules(context.calculationRules);
  
  if (simplifiedRules) {
    try {
      return await this.calculateWithSimplifiedRules(context.dataContext, simplifiedRules);
    } catch (simplifiedError) {
      // 简化计算也失败，使用缓存结果
      return await this.getCachedCalculationResult(context);
    }
  }
  
  throw error;
}
```

### 3. 验证超时恢复
```javascript
async recoverValidationTimeout(error, context) {
  // 使用快速验证模式
  const fastValidationRules = {
    ...context.validationRules,
    validationMode: 'fast',
    fieldsToValidate: this.getCriticalFields(context.validationRules.fieldsToValidate)
  };
  
  try {
    return await this.validateWithFastMode(context.calculatedResults, context.originalData, fastValidationRules);
  } catch (fastValidationError) {
    // 快速验证也失败，跳过验证
    return this.buildSkippedValidationResult(context);
  }
}
```

## 🎯 降级策略

### 1. 计算引擎降级
```javascript
async calculationFallback(error, context) {
  // 策略1：使用缓存的计算结果
  const cachedResult = await this.getCachedCalculationResult(context);
  if (cachedResult) {
    return {
      ...cachedResult,
      metadata: {
        ...cachedResult.metadata,
        fallbackUsed: true,
        fallbackReason: error.message
      }
    };
  }
  
  // 策略2：使用简化计算
  const simplifiedResult = await this.performSimplifiedCalculation(context);
  if (simplifiedResult) {
    return {
      ...simplifiedResult,
      metadata: {
        calculationMode: 'simplified',
        fallbackUsed: true,
        fallbackReason: error.message
      }
    };
  }
  
  // 策略3：返回原始数据
  return {
    childCalculations: context.dataContext.childRecordList.map(record => ({
      recordId: record.id,
      calculatedFields: {},
      calculationDetails: {}
    })),
    mainCalculations: {
      calculatedFields: {},
      calculationDetails: {}
    },
    calculationMetadata: {
      calculationMode: 'fallback',
      fallbackUsed: true,
      fallbackReason: error.message
    }
  };
}
```

### 2. 验证对比降级
```javascript
async validationFallback(error, context) {
  // 策略1：跳过验证，假设数据有效
  return {
    isTampered: false,
    conclusion: "验证跳过（降级模式）",
    overallStatus: "VALIDATION_SKIPPED",
    tamperedFields: [],
    validFields: [],
    tamperedDetails: [],
    validationSummary: {
      totalFieldsChecked: 0,
      tamperedFieldsCount: 0,
      validFieldsCount: 0,
      validationSkipped: true,
      skipReason: error.message
    },
    validationMetadata: {
      validationTime: 0,
      fallbackUsed: true,
      fallbackReason: error.message
    }
  };
}
```

### 3. 纠错处理降级
```javascript
async correctionFallback(error, context) {
  // 策略1：返回原始数据，不进行纠错
  return {
    correctedData: context.originalData,
    correctionLog: {
      correctionSummary: {
        totalFieldsCorrected: 0,
        correctionTime: 0,
        correctionMode: "skipped",
        dataIntegrityCheck: "SKIPPED"
      },
      fieldCorrections: [],
      correctionMetadata: {
        correctionSkipped: true,
        skipReason: error.message,
        fallbackUsed: true
      }
    },
    postCorrectionValidation: {
      validationPassed: false,
      validationSkipped: true,
      skipReason: error.message
    }
  };
}
```

### 4. 结果输出降级
```javascript
async outputFallback(error, context) {
  // 策略1：使用精简格式
  try {
    return await this.buildMinimalResponse(context.inputData, { responseFormat: 'minimal' });
  } catch (minimalError) {
    // 策略2：返回基础错误响应
    return {
      success: false,
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        fallbackUsed: true
      },
      metadata: {
        processingTime: Date.now() - context.startTime,
        fallbackReason: error.message
      }
    };
  }
}
```

## 📊 错误监控和报告

### 1. 错误统计
```javascript
class ErrorMonitor {
  constructor() {
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      errorsByCode: {},
      recoverySuccessRate: 0,
      fallbackUsageRate: 0
    };
  }
  
  recordError(error, recovered = false, fallbackUsed = false) {
    this.errorStats.totalErrors++;
    
    // 按类别统计
    const category = this.getErrorCategory(error.code);
    this.errorStats.errorsByCategory[category] = (this.errorStats.errorsByCategory[category] || 0) + 1;
    
    // 按严重程度统计
    this.errorStats.errorsBySeverity[error.severity] = (this.errorStats.errorsBySeverity[error.severity] || 0) + 1;
    
    // 按错误代码统计
    this.errorStats.errorsByCode[error.code] = (this.errorStats.errorsByCode[error.code] || 0) + 1;
    
    // 恢复和降级统计
    if (recovered) {
      this.errorStats.recoveredErrors = (this.errorStats.recoveredErrors || 0) + 1;
    }
    
    if (fallbackUsed) {
      this.errorStats.fallbackErrors = (this.errorStats.fallbackErrors || 0) + 1;
    }
    
    // 计算成功率
    this.updateSuccessRates();
  }
  
  generateErrorReport() {
    return {
      reportTime: new Date().toISOString(),
      summary: {
        totalErrors: this.errorStats.totalErrors,
        recoverySuccessRate: this.errorStats.recoverySuccessRate,
        fallbackUsageRate: this.errorStats.fallbackUsageRate
      },
      breakdown: {
        byCategory: this.errorStats.errorsByCategory,
        bySeverity: this.errorStats.errorsBySeverity,
        byCode: this.errorStats.errorsByCode
      },
      trends: this.calculateErrorTrends(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

### 2. 错误告警
```javascript
class ErrorAlerting {
  constructor(config) {
    this.config = config;
    this.alertThresholds = {
      criticalErrorRate: 0.01,    // 1%
      highErrorRate: 0.05,        // 5%
      recoveryFailureRate: 0.1,   // 10%
      fallbackUsageRate: 0.2      // 20%
    };
  }
  
  checkAlertConditions(errorStats) {
    const alerts = [];
    
    // 检查严重错误率
    const criticalRate = errorStats.errorsBySeverity.CRITICAL / errorStats.totalErrors;
    if (criticalRate > this.alertThresholds.criticalErrorRate) {
      alerts.push({
        type: 'CRITICAL_ERROR_RATE_HIGH',
        severity: 'CRITICAL',
        message: `严重错误率过高: ${(criticalRate * 100).toFixed(2)}%`,
        threshold: this.alertThresholds.criticalErrorRate,
        actual: criticalRate
      });
    }
    
    // 检查恢复失败率
    const recoveryFailureRate = 1 - errorStats.recoverySuccessRate;
    if (recoveryFailureRate > this.alertThresholds.recoveryFailureRate) {
      alerts.push({
        type: 'RECOVERY_FAILURE_RATE_HIGH',
        severity: 'HIGH',
        message: `错误恢复失败率过高: ${(recoveryFailureRate * 100).toFixed(2)}%`,
        threshold: this.alertThresholds.recoveryFailureRate,
        actual: recoveryFailureRate
      });
    }
    
    return alerts;
  }
  
  async sendAlerts(alerts) {
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }
}
```

## 🔧 配置选项

### 错误处理配置
```javascript
{
  errorHandling: {
    enableRetry: true,              // 启用重试
    maxRetryAttempts: 3,            // 最大重试次数
    retryDelay: 1000,               // 重试延迟(ms)
    enableFallback: true,           // 启用降级
    logErrors: true,                // 记录错误
    enableMonitoring: true,         // 启用监控
    enableAlerting: true            // 启用告警
  },
  recovery: {
    enableDatabaseRecovery: true,   // 启用数据库恢复
    enableCalculationRecovery: true, // 启用计算恢复
    enableValidationRecovery: true, // 启用验证恢复
    enableCorrectionRecovery: true, // 启用纠错恢复
    recoveryTimeout: 30000          // 恢复超时(ms)
  },
  fallback: {
    enableCalculationFallback: true, // 启用计算降级
    enableValidationFallback: true,  // 启用验证降级
    enableCorrectionFallback: true,  // 启用纠错降级
    enableOutputFallback: true,      // 启用输出降级
    fallbackTimeout: 10000           // 降级超时(ms)
  },
  monitoring: {
    errorStatsRetention: 86400000,   // 错误统计保留时间(ms)
    alertCheckInterval: 60000,       // 告警检查间隔(ms)
    reportGenerationInterval: 3600000 // 报告生成间隔(ms)
  }
}
```

## 🧪 错误处理测试

### 1. 错误注入测试
```javascript
class ErrorInjectionTester {
  constructor() {
    this.injectionRules = new Map();
  }
  
  injectError(module, method, errorCode, probability = 1.0) {
    const key = `${module}.${method}`;
    this.injectionRules.set(key, { errorCode, probability });
  }
  
  shouldInjectError(module, method) {
    const key = `${module}.${method}`;
    const rule = this.injectionRules.get(key);
    
    if (rule && Math.random() < rule.probability) {
      return rule.errorCode;
    }
    
    return null;
  }
}
```

### 2. 恢复策略测试
```javascript
describe('Error Recovery Tests', () => {
  test('Database connection recovery', async () => {
    // 模拟数据库连接失败
    const error = new SystemError('DR001', '数据库连接失败');
    
    // 测试恢复策略
    const result = await errorHandler.recoverDatabaseConnection(error, context);
    
    expect(result).toBeDefined();
    expect(result.recovered).toBe(true);
  });
  
  test('Calculation timeout recovery', async () => {
    // 模拟计算超时
    const error = new SystemError('CE006', '计算超时');
    
    // 测试恢复策略
    const result = await errorHandler.recoverCalculationTimeout(error, context);
    
    expect(result).toBeDefined();
    expect(result.calculationMode).toBe('simplified');
  });
});
```

### 3. 降级策略测试
```javascript
describe('Fallback Strategy Tests', () => {
  test('Calculation fallback', async () => {
    // 模拟计算引擎错误
    const error = new SystemError('CE001', '公式解析错误');
    
    // 测试降级策略
    const result = await errorHandler.calculationFallback(error, context);
    
    expect(result).toBeDefined();
    expect(result.metadata.fallbackUsed).toBe(true);
  });
  
  test('Output fallback', async () => {
    // 模拟输出错误
    const error = new SystemError('RO001', '响应构建错误');
    
    // 测试降级策略
    const result = await errorHandler.outputFallback(error, context);
    
    expect(result.success).toBe(false);
    expect(result.error.fallbackUsed).toBe(true);
  });
});
```

## 📈 错误处理最佳实践

### 1. 错误预防
- 输入验证：严格验证所有输入数据
- 边界检查：检查数值范围和数组边界
- 资源管理：正确管理数据库连接和内存
- 超时设置：为所有异步操作设置合理超时

### 2. 错误检测
- 主动监控：实时监控系统状态
- 健康检查：定期检查各模块健康状态
- 异常捕获：全面捕获和处理异常
- 日志记录：详细记录错误信息

### 3. 错误恢复
- 快速失败：对于不可恢复的错误快速失败
- 优雅降级：提供合理的降级方案
- 重试机制：对于临时错误实施重试
- 状态恢复：恢复到一致的系统状态

### 4. 错误学习
- 错误分析：定期分析错误模式
- 改进措施：基于错误分析改进系统
- 预防措施：实施预防性措施
- 知识积累：积累错误处理经验