// 安全解析JSON函数
function getSafeJsonData(data) {
  try {
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('JSON解析错误:', e);
    return {};
  }
}

// 辅助函数：判断是否为普通对象
function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

// 辅助函数：比较数组是否相等
function isArrayEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// 辅助函数：获取变更类型
function getChangeType(currentVal, previousVal) {
  return previousVal === undefined ? 'added' :
         currentVal === undefined ? 'removed' : 'changed';
}

// 比较字段差异
function compareFields(currentData, previousData, path = '') {
  const changedFields = [];
  const allKeys = new Set([
    ...Object.keys(currentData || {}),
    ...Object.keys(previousData || {})
  ]);

  Array.from(allKeys).forEach(key => {
    const currentVal = currentData?.[key];
    const previousVal = previousData?.[key];
    const currentPath = path ? `${path}.${key}` : key;

    // 处理数组类型
    if (Array.isArray(currentVal) || Array.isArray(previousVal)) {
      if (!isArrayEqual(currentVal, previousVal)) {
        changedFields.push({
          field: currentPath,
          type: getChangeType(currentVal, previousVal),
          oldValue: JSON.stringify(previousVal),
          newValue: JSON.stringify(currentVal)
        });
      }
      return;
    }

    // 处理对象类型
    if (isObject(currentVal) || isObject(previousVal)) {
      if (isObject(currentVal) && isObject(previousVal)) {
        // 递归对比嵌套对象
        const nestedDiffs = compareFields(currentVal, previousVal, currentPath);
        changedFields.push(...nestedDiffs);
      } else {
        // 对象类型变化
        changedFields.push({
          field: currentPath,
          type: getChangeType(currentVal, previousVal),
          oldValue: isObject(previousVal) ? '[Object]' : previousVal,
          newValue: isObject(currentVal) ? '[Object]' : currentVal
        });
      }
      return;
    }

    // 基本类型值比较
    if (currentVal !== previousVal) {
      changedFields.push({
        field: currentPath,
        type: getChangeType(currentVal, previousVal),
        oldValue: previousVal,
        newValue: currentVal
      });
    }
  });

  return changedFields;
}

// 转换差异数组中的字段名为中文
function translateDiffFields(diffs, fieldNames) {
  return diffs.map(diff => {
    // 处理嵌套字段路径（如：a.b.c）
    const fieldPath = diff.field.split('.');
    const lastField = fieldPath.pop();
    const translatedLastField = fieldNames[lastField] || lastField;
    
    return {
      ...diff,
      field: [...fieldPath, translatedLastField].join('.'),
      fieldName: fieldNames[lastField] || lastField
    };
  });
}

function generateDiffHtml(diffs) {
    return `
    <style>
        .diff-container {
            font-family: Arial, sans-serif;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .diff-item {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
        }
        .diff-item.added {
            background-color: #e6ffed;
            border-left: 4px solid #28a745;
        }
        .diff-item.removed {
            background-color: #ffeef0;
            border-left: 4px solid #cb2431;
        }
        .diff-item.changed {
            background-color: #fff8e6;
            border-left: 4px solid #ffd33d;
        }
        .field-name {
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        .change-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 5px;
        }
        .old-value {
            color: #cb2431;
            background-color: #ffeef0;
            padding: 2px 6px;
            border-radius: 3px;
            flex-shrink: 0;
        }
        .arrow {
            color: #666;
            font-weight: bold;
            flex-shrink: 0;
        }
        .new-value {
            color: #28a745;
            background-color: #e6ffed;
            padding: 2px 6px;
            border-radius: 3px;
            flex-shrink: 0;
        }
        .value {
            display: block;
            margin-bottom: 5px;
        }
        .value-label {
            font-weight: bold;
            margin-right: 5px;
        }
    </style>
    <div class="diff-container">
        ${diffs.map(diff => {
            // 根据变更类型设置不同的显示方式
            if (diff.type === 'changed') {
                return `
                <div class="diff-item changed">
                    <span class="field-name">${diff.field}</span>
                    <div class="change-container">
                        <span class="old-value">${diff.oldValue}</span>
                        <span class="arrow">→</span>
                        <span class="new-value">${diff.newValue}</span>
                    </div>
                </div>`;
            } else if (diff.type === 'added') {
                return `
                <div class="diff-item added">
                    <span class="field-name">${diff.field}</span>
                    <span class="value"><span class="value-label">新增值:</span> ${diff.newValue}</span>
                </div>`;
            } else { // removed
                return `
                <div class="diff-item removed">
                    <span class="field-name">${diff.field}</span>
                    <span class="value"><span class="value-label">删除值:</span> ${diff.oldValue}</span>
                </div>`;
            }
        }).join('')}
    </div>`;
}

// 平台主入口函数
async function main() {
  try {
    // 1. 获取数据快照
    const _currentSnapshotData = getSafeJsonData(getSnapshotDetail?.data?.items?.[0]?.currentData);
    const _previousSnapshotData = getSafeJsonData(getSnapshotDetail?.data?.items?.[0]?.previousData);

    // 2. 获取字段信息并创建映射
    const _fieldInfoRes = await getFieldInfo.trigger();
    const _fieldNames = Object.entries(_fieldInfoRes?.fieldMap || {}).reduce((acc, [_, field]) => {
      if (field?.apiName && field?.label) {
        acc[field.apiName] = field.label;
      }
      return acc;
    }, {});

    // 3. 执行差异对比
    const diffs = compareFields(_currentSnapshotData, _previousSnapshotData);
    
    // 4. 翻译字段名为中文
    const translatedDiffs = translateDiffFields(diffs, _fieldNames);

    // 5. 生成完整HTML
    const htmlContent = generateDiffHtml(translatedDiffs);

    // 6. 设置平台变量（如果有）
    if (typeof compareHtml !== 'undefined' && compareHtml.setValue) {
      compareHtml.setValue(htmlContent);
    }

    return {
      success: true,
      changedCount: diffs.length,
      changedFields: diffs.map(d => d.field),
      html: htmlContent
    };
  } catch (error) {
    console.error('主函数执行错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行并返回结果
return main();