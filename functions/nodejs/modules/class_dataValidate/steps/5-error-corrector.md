# 模块5：纠错处理模块 (ErrorCorrector)

## 📝 模块概述

纠错处理模块负责在检测到数据篡改时，使用正确的计算值替换被篡改的字段值，生成纠错后的数据集，并记录纠错日志。

## 🎯 职责描述

当验证对比模块检测到数据篡改时，使用计算引擎的正确计算结果替换被篡改的字段值，生成纠错后的完整数据集。

## ⚙️ 核心功能

### 字段纠错
- 使用正确的计算值替换被篡改的字段
- 支持批量字段纠错处理
- 保持数据结构的完整性

### 数据重构
- 重新构建纠错后的完整数据集
- 维护主子表之间的关联关系
- 确保数据一致性

### 纠错日志
- 记录所有纠错操作的详细信息
- 追踪字段修改前后的值变化
- 生成纠错审计报告

### 数据验证
- 验证纠错后数据的正确性
- 确保纠错操作不引入新的错误
- 进行数据完整性检查

## 📋 输入输出参数简述

### 输入参数
- **validationResult**: 验证结果（来自验证对比模块）
- **calculatedResults**: 正确的计算结果
- **originalData**: 用户提交的原始数据
- **correctionConfig**: 纠错配置（纠错模式、策略等）

### 输出参数
- **成功时**: 返回 `correctedData` 和 `correctionLog`，包含纠错后的数据和详细的纠错记录
- **失败时**: 返回错误信息，包含纠错失败原因和错误详情

## 📥 输入格式

### 输入参数结构
```javascript
{
  validationResult: {
    isTampered: true,
    tamperedDetails: [
      {
        recordType: "main",
        recordId: "purchase_001",
        fieldName: "totalAmount",
        submittedValue: 15500.00,
        calculatedValue: 15000.00,
        absoluteDifference: 500.00,
        relativeDifference: 0.0333,
        severity: "HIGH"
      },
      {
        recordType: "main",
        recordId: "purchase_001", 
        fieldName: "finalAmount",
        submittedValue: 14725.00,
        calculatedValue: 14250.00,
        absoluteDifference: 475.00,
        relativeDifference: 0.0333,
        severity: "HIGH"
      }
    ],
    validFields: ["item_001.subtotal", "item_002.subtotal"],
    validationSummary: {
      totalFieldsChecked: 4,
      tamperedFieldsCount: 2,
      validFieldsCount: 2
    }
  },
  calculatedResults: {
    childCalculations: [
      {
        recordId: "item_001",
        calculatedFields: { 
          subtotal: 5000.00 
        },
        calculationDetails: {
          formula: "price * quantity",
          inputs: { price: 100.00, quantity: 50 },
          result: 5000.00
        }
      },
      {
        recordId: "item_002",
        calculatedFields: { 
          subtotal: 10000.00 
        },
        calculationDetails: {
          formula: "price * quantity", 
          inputs: { price: 200.00, quantity: 50 },
          result: 10000.00
        }
      }
    ],
    mainCalculations: {
      calculatedFields: {
        totalAmount: 15000.00,
        finalAmount: 14250.00
      },
      calculationDetails: {
        totalAmount: {
          formula: "SUM(child.subtotal)",
          inputs: [5000.00, 10000.00],
          result: 15000.00
        },
        finalAmount: {
          formula: "totalAmount * (1 - discountRate)",
          inputs: { totalAmount: 15000.00, discountRate: 0.05 },
          result: 14250.00
        }
      }
    }
  },
  originalData: {
    editedRecord: {
      id: "purchase_001",
      purchaseDate: "2024-01-15",
      supplier: "供应商A",
      discountRate: 0.05,
      totalAmount: 15500.00,      // 被篡改的值
      finalAmount: 14725.00,      // 被篡改的值
      status: "pending"
    },
    editType: "main",
    childRecordList: [
      {
        id: "item_001",
        productName: "产品A",
        price: 100.00,
        quantity: 50,
        subtotal: 5000.00         // 正确的值
      },
      {
        id: "item_002",
        productName: "产品B", 
        price: 200.00,
        quantity: 50,
        subtotal: 10000.00        // 正确的值
      }
    ]
  },
  correctionConfig: {
    correctionMode: "auto",       // auto/manual/selective
    preserveOriginalData: true,   // 是否保留原始数据
    logCorrectionDetails: true,   // 是否记录纠错详情
    validateAfterCorrection: true, // 纠错后是否重新验证
    correctionPriority: "calculated", // calculated/submitted
    fieldCorrectionRules: {       // 字段级纠错规则
      "totalAmount": {
        correctionEnabled: true,
        requiresApproval: false
      },
      "finalAmount": {
        correctionEnabled: true,
        requiresApproval: false
      }
    }
  }
}
```

### 参数说明

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| validationResult | Object | 是 | 来自验证对比模块的验证结果 |
| calculatedResults | Object | 是 | 来自计算引擎的正确计算结果 |
| originalData | Object | 是 | 用户提交的原始数据 |
| correctionConfig | Object | 否 | 纠错配置选项 |

### 纠错配置详细说明

| 字段名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| correctionMode | String | 否 | 纠错模式：auto(自动)/manual(手动)/selective(选择性) |
| preserveOriginalData | Boolean | 否 | 是否在纠错结果中保留原始数据 |
| logCorrectionDetails | Boolean | 否 | 是否记录详细的纠错日志 |
| validateAfterCorrection | Boolean | 否 | 纠错后是否重新验证数据 |
| correctionPriority | String | 否 | 纠错优先级：calculated(计算值)/submitted(提交值) |
| fieldCorrectionRules | Object | 否 | 字段级别的纠错规则 |

## 📤 输出格式

### 纠错成功的输出
```javascript
{
  success: true,
  correctedData: {
    editedRecord: {
      id: "purchase_001",
      purchaseDate: "2024-01-15",
      supplier: "供应商A",
      discountRate: 0.05,
      totalAmount: 15000.00,      // 已纠错：15500.00 → 15000.00
      finalAmount: 14250.00,      // 已纠错：14725.00 → 14250.00
      status: "pending"
    },
    childRecordList: [
      {
        id: "item_001",
        productName: "产品A",
        price: 100.00,
        quantity: 50,
        subtotal: 5000.00         // 未被篡改，保持原值
      },
      {
        id: "item_002",
        productName: "产品B",
        price: 200.00,
        quantity: 50,
        subtotal: 10000.00        // 未被篡改，保持原值
      }
    ]
  },
  correctionLog: {
    correctionSummary: {
      totalFieldsCorrected: 2,
      correctionTime: 8,          // 纠错耗时(ms)
      correctionMode: "auto",
      dataIntegrityCheck: "PASSED"
    },
    fieldCorrections: [
      {
        recordType: "main",
        recordId: "purchase_001",
        fieldName: "totalAmount",
        correctionAction: "REPLACED",
        originalValue: 15500.00,
        correctedValue: 15000.00,
        correctionReason: "数据篡改检测",
        correctionSource: "calculated_result",
        correctionTimestamp: "2024-01-15T10:30:15.123Z",
        severity: "HIGH",
        calculationFormula: "SUM(child.subtotal)",
        calculationInputs: [5000.00, 10000.00],
        confidence: 1.0           // 纠错置信度
      },
      {
        recordType: "main",
        recordId: "purchase_001",
        fieldName: "finalAmount", 
        correctionAction: "REPLACED",
        originalValue: 14725.00,
        correctedValue: 14250.00,
        correctionReason: "数据篡改检测",
        correctionSource: "calculated_result",
        correctionTimestamp: "2024-01-15T10:30:15.125Z",
        severity: "HIGH",
        calculationFormula: "totalAmount * (1 - discountRate)",
        calculationInputs: { totalAmount: 15000.00, discountRate: 0.05 },
        confidence: 1.0
      }
    ],
    preservedOriginalData: {      // 原始数据备份
      editedRecord: {
        totalAmount: 15500.00,
        finalAmount: 14725.00
      }
    },
    correctionMetadata: {
      correctionEngine: "ErrorCorrector_v1.0",
      correctionRules: {
        autoCorrection: true,
        preserveNonTamperedFields: true,
        validateAfterCorrection: true
      },
      dataConsistencyCheck: {
        preCorrection: "INCONSISTENT",
        postCorrection: "CONSISTENT"
      },
      performanceMetrics: {
        correctionTime: 8,
        memoryUsage: "2.1MB",
        fieldsProcessed: 4,
        correctionRate: 0.5       // 纠错字段比例
      }
    }
  },
  postCorrectionValidation: {     // 纠错后验证结果
    validationPassed: true,
    allFieldsValid: true,
    validationTime: 5,
    validationSummary: {
      totalFieldsValidated: 4,
      validFieldsCount: 4,
      tamperedFieldsCount: 0
    }
  }
}
```

### 纠错失败的输出
```javascript
{
  success: false,
  error: {
    code: "CORRECTION_ERROR",
    message: "纠错过程中发生错误",
    details: {
      errorType: "MISSING_CALCULATED_VALUE",
      fieldName: "totalAmount",
      recordId: "purchase_001",
      reason: "计算结果中缺少对应的纠错值"
    },
    timestamp: "2024-01-15T10:30:00.000Z",
    module: "ErrorCorrector"
  },
  partialCorrectionResult: {      // 部分纠错结果
    correctedFieldsCount: 1,
    failedFieldsCount: 1,
    correctedFields: ["finalAmount"],
    failedFields: ["totalAmount"]
  }
}
```

## 🔧 纠错算法

### 1. 字段纠错映射
```javascript
function buildCorrectionMap(tamperedDetails, calculatedResults) {
  const correctionMap = new Map();
  
  tamperedDetails.forEach(tamperedField => {
    const { recordType, recordId, fieldName } = tamperedField;
    
    let correctValue;
    if (recordType === 'main') {
      correctValue = calculatedResults.mainCalculations.calculatedFields[fieldName];
    } else if (recordType === 'child') {
      const childCalc = calculatedResults.childCalculations.find(c => c.recordId === recordId);
      correctValue = childCalc?.calculatedFields[fieldName];
    }
    
    if (correctValue !== undefined) {
      correctionMap.set(`${recordType}.${recordId}.${fieldName}`, {
        originalValue: tamperedField.submittedValue,
        correctedValue: correctValue,
        correctionSource: 'calculated_result',
        calculationDetails: getCalculationDetails(recordType, recordId, fieldName, calculatedResults)
      });
    }
  });
  
  return correctionMap;
}
```

### 2. 数据结构重构
```javascript
function applyCorrectionToData(originalData, correctionMap) {
  const correctedData = JSON.parse(JSON.stringify(originalData)); // 深拷贝
  
  correctionMap.forEach((correction, fieldPath) => {
    const [recordType, recordId, fieldName] = fieldPath.split('.');
    
    if (recordType === 'main') {
      correctedData.editedRecord[fieldName] = correction.correctedValue;
    } else if (recordType === 'child') {
      const childRecord = correctedData.childRecordList.find(c => c.id === recordId);
      if (childRecord) {
        childRecord[fieldName] = correction.correctedValue;
      }
    }
  });
  
  return correctedData;
}
```

### 3. 纠错日志生成
```javascript
function generateCorrectionLog(correctionMap, correctionConfig) {
  const fieldCorrections = [];
  
  correctionMap.forEach((correction, fieldPath) => {
    const [recordType, recordId, fieldName] = fieldPath.split('.');
    
    fieldCorrections.push({
      recordType,
      recordId,
      fieldName,
      correctionAction: "REPLACED",
      originalValue: correction.originalValue,
      correctedValue: correction.correctedValue,
      correctionReason: "数据篡改检测",
      correctionSource: correction.correctionSource,
      correctionTimestamp: new Date().toISOString(),
      calculationFormula: correction.calculationDetails?.formula,
      calculationInputs: correction.calculationDetails?.inputs,
      confidence: 1.0
    });
  });
  
  return {
    correctionSummary: {
      totalFieldsCorrected: fieldCorrections.length,
      correctionTime: Date.now() - startTime,
      correctionMode: correctionConfig.correctionMode,
      dataIntegrityCheck: "PASSED"
    },
    fieldCorrections
  };
}
```

### 4. 纠错后验证
```javascript
async function validateCorrectedData(correctedData, calculatedResults, validationRules) {
  // 重新执行验证流程
  const validationResult = await ValidationComparator.validate({
    calculatedResults,
    originalData: correctedData,
    validationRules
  });
  
  return {
    validationPassed: !validationResult.isTampered,
    allFieldsValid: validationResult.tamperedDetails.length === 0,
    validationTime: validationResult.validationMetadata.validationTime,
    validationSummary: validationResult.validationSummary
  };
}
```

## 🎯 纠错策略

### 自动纠错模式 (auto)
```javascript
{
  correctionMode: "auto",
  strategy: {
    correctAllTamperedFields: true,    // 纠错所有篡改字段
    preserveValidFields: true,         // 保留有效字段
    requiresApproval: false,           // 不需要人工审批
    logAllCorrections: true            // 记录所有纠错操作
  }
}
```

### 手动纠错模式 (manual)
```javascript
{
  correctionMode: "manual",
  strategy: {
    requiresApproval: true,            // 需要人工审批
    showCorrectionPreview: true,       // 显示纠错预览
    allowFieldSelection: true,         // 允许选择纠错字段
    confirmBeforeApply: true           // 应用前确认
  }
}
```

### 选择性纠错模式 (selective)
```javascript
{
  correctionMode: "selective",
  strategy: {
    correctionRules: {
      highSeverityOnly: true,          // 只纠错高严重程度字段
      criticalFieldsOnly: false,       // 只纠错关键字段
      userDefinedFields: ["totalAmount"] // 用户指定字段
    },
    requiresApproval: true,
    logSelectionCriteria: true
  }
}
```

## 🔍 数据完整性检查

### 纠错前检查
```javascript
function preCorrectionsCheck(originalData, calculatedResults) {
  const checks = {
    dataStructureIntegrity: checkDataStructure(originalData),
    calculatedResultsAvailability: checkCalculatedResults(calculatedResults),
    fieldMappingConsistency: checkFieldMapping(originalData, calculatedResults),
    dataTypeConsistency: checkDataTypes(originalData, calculatedResults)
  };
  
  return {
    passed: Object.values(checks).every(check => check.passed),
    details: checks
  };
}
```

### 纠错后检查
```javascript
function postCorrectionsCheck(correctedData, originalData, correctionLog) {
  const checks = {
    dataConsistency: checkDataConsistency(correctedData),
    correctionCompleteness: checkCorrectionCompleteness(correctionLog),
    noDataLoss: checkNoDataLoss(correctedData, originalData),
    calculationAccuracy: recheckCalculations(correctedData)
  };
  
  return {
    passed: Object.values(checks).every(check => check.passed),
    details: checks
  };
}
```

## ❌ 错误处理

### 错误类型分类

| 错误代码 | 错误类型 | 说明 |
|----------|----------|------|
| MISSING_CALCULATED_VALUE | 计算值缺失 | 计算结果中缺少纠错所需的值 |
| CORRECTION_CONFLICT | 纠错冲突 | 多个纠错规则产生冲突 |
| DATA_STRUCTURE_ERROR | 数据结构错误 | 原始数据结构不完整或损坏 |
| CORRECTION_TIMEOUT | 纠错超时 | 纠错过程超时 |
| VALIDATION_AFTER_CORRECTION_FAILED | 纠错后验证失败 | 纠错后数据仍然不一致 |

### 错误恢复策略
```javascript
{
  errorRecovery: {
    partialCorrectionAllowed: true,    // 允许部分纠错
    skipFailedFields: true,            // 跳过失败的字段
    rollbackOnFailure: false,          // 失败时是否回滚
    logFailureDetails: true,           // 记录失败详情
    retryFailedCorrections: true,      // 重试失败的纠错
    maxRetryAttempts: 3                // 最大重试次数
  }
}
```

## 🔧 配置选项

### 纠错配置
```javascript
{
  correction: {
    defaultCorrectionMode: "auto",     // 默认纠错模式
    maxFieldsToCorrect: 1000,          // 最大纠错字段数
    correctionTimeout: 10000,          // 纠错超时时间(ms)
    preserveOriginalData: true,        // 保留原始数据
    validateAfterCorrection: true      // 纠错后验证
  },
  logging: {
    logLevel: "detailed",              // 日志级别：basic/detailed/verbose
    logCorrectionDetails: true,        // 记录纠错详情
    logCalculationFormulas: true,      // 记录计算公式
    logPerformanceMetrics: true        // 记录性能指标
  },
  validation: {
    enablePostCorrectionValidation: true, // 启用纠错后验证
    strictValidationAfterCorrection: true, // 纠错后严格验证
    validationTimeout: 5000            // 验证超时时间(ms)
  }
}
```

## 📊 性能指标

### 处理时间基准
- 单字段纠错：< 1ms
- 批量字段纠错：< 10ms
- 数据结构重构：< 5ms
- 纠错后验证：< 20ms
- 总纠错时间：< 30ms

### 纠错能力
- 最大纠错字段数：1,000个
- 最大记录数：10,000条
- 并发纠错支持：是
- 内存使用：< 100MB

## 🧪 测试用例

### 正常场景测试
1. 单字段纠错测试
2. 多字段批量纠错测试
3. 主表子表混合纠错测试
4. 纠错后验证测试

### 异常场景测试
1. 计算值缺失处理
2. 数据结构损坏处理
3. 纠错超时处理
4. 纠错后验证失败处理

### 性能测试
1. 大数据量纠错测试
2. 复杂数据结构纠错测试
3. 并发纠错测试
4. 内存使用测试

## 🔗 上下游模块接口

### 接收来自验证对比模块
```javascript
{
  validationResult: {
    isTampered: true,
    tamperedDetails: [ /* 篡改详情 */ ],
    validationSummary: { /* 验证摘要 */ }
  },
  calculatedResults: { /* 计算结果 */ },
  originalData: { /* 原始数据 */ }
}
```

### 传递给结果输出模块
```javascript
{
  correctedData: { /* 纠错后的数据 */ },
  correctionLog: { /* 纠错日志 */ },
  postCorrectionValidation: { /* 纠错后验证结果 */ }
}
```

## 📈 纠错报告

### 详细纠错报告
```javascript
{
  correctionReport: {
    executionSummary: {
      totalExecutionTime: 25,
      fieldsCorrected: 2,
      recordsProcessed: 3,
      correctionSuccessRate: 1.0
    },
    correctionDetails: [
      {
        fieldPath: "main.purchase_001.totalAmount",
        correctionStatus: "SUCCESS",
        correctionMethod: "CALCULATED_REPLACEMENT",
        originalValue: 15500.00,
        correctedValue: 15000.00,
        correctionConfidence: 1.0,
        calculationSource: {
          formula: "SUM(child.subtotal)",
          inputs: [5000.00, 10000.00],
          calculationTime: 2
        }
      }
    ],
    dataIntegrityAnalysis: {
      preCorrection: {
        dataConsistency: "INCONSISTENT",
        tamperedFieldsCount: 2,
        validFieldsCount: 2
      },
      postCorrection: {
        dataConsistency: "CONSISTENT",
        tamperedFieldsCount: 0,
        validFieldsCount: 4
      }
    },
    performanceMetrics: {
      correctionTime: 8,
      validationTime: 5,
      totalTime: 25,
      memoryUsage: "2.1MB",
      correctionThroughput: "250 fields/second"
    },
    qualityAssurance: {
      correctionAccuracy: 1.0,
      dataLossCheck: "NO_DATA_LOSS",
      calculationVerification: "VERIFIED",
      postCorrectionValidation: "PASSED"
    }
  }
}
```

## 🔄 纠错流程优化

### 批量纠错
```javascript
// 批量处理多个字段纠错
async function batchCorrection(correctionMap, correctionConfig) {
  const correctionPromises = Array.from(correctionMap.entries()).map(async ([fieldPath, correction]) => {
    return await correctField(fieldPath, correction, correctionConfig);
  });
  
  return await Promise.all(correctionPromises);
}
```

### 增量纠错
```javascript
// 只纠错发生变化的字段
function incrementalCorrection(previousCorrectionResult, currentValidationResult) {
  const newTamperedFields = currentValidationResult.tamperedDetails.filter(field => 
    !previousCorrectionResult.correctedFields.includes(field.fieldName)
  );
  
  return correctFields(newTamperedFields);
}
```

### 智能纠错优先级
```javascript
// 根据字段重要性和篡改严重程度确定纠错优先级
function prioritizeCorrections(tamperedDetails) {
  return tamperedDetails.sort((a, b) => {
    // 首先按严重程度排序
    const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    
    if (severityDiff !== 0) return severityDiff;
    
    // 然后按字段重要性排序
    const fieldImportance = getFieldImportance(a.fieldName) - getFieldImportance(b.fieldName);
    return fieldImportance;
  });
}
```