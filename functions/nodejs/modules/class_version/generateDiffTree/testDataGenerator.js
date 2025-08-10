/**
 * generateDiffTree 测试数据生成器
 * 整合真实数据获取和差异树生成功能
 */

const { fetchRealTestData } = require('./fetchRealTestData');

/**
 * 为 generateDiffTree 生成完整的测试用例
 * @param {Object} config - 配置参数
 * @param {Logger} logger - 日志记录器
 * @returns {Object} 完整的测试数据和结果
 */
async function generateTestCase(config, logger) {
    const {
        objectApiName,
        strategy = 'random',
        fetchOptions = {},
        diffOptions = {}
    } = config;
    
    logger.info('开始生成 generateDiffTree 测试用例');
    
    try {
        // 1. 获取真实测试数据
        const realDataResult = await fetchRealTestData(
            objectApiName, 
            strategy, 
            fetchOptions, 
            logger
        );
        
        if (!realDataResult.success) {
            throw new Error('获取真实测试数据失败');
        }
        
        const { oldData, newData } = realDataResult;
        
        // 2. 构造 generateDiffTree 的完整输入参数
        const generateDiffTreeParams = {
            oldData,
            newData,
            ignoreFields: diffOptions.ignoreFields || [
                '_id', '_createTime', '_updateTime', 'lastUpdateTime'
            ],
            options: {
                includeUnchanged: diffOptions.includeUnchanged || false,
                maxDepth: diffOptions.maxDepth || 10,
                arrayComparison: diffOptions.arrayComparison || 'index',
                customComparators: diffOptions.customComparators || {},
                enableDiagnostics: diffOptions.enableDiagnostics || true,
                ...diffOptions.options
            }
        };
        
        // 3. 调用 generateDiffTree 函数
        const generateDiffTree = require('./index');
        const diffResult = await generateDiffTree(generateDiffTreeParams, {}, logger);
        
        // 4. 构造完整的测试结果
        const testCase = {
            metadata: {
                testId: `test_${Date.now()}`,
                timestamp: new Date().toISOString(),
                objectApiName,
                strategy,
                dataSource: realDataResult.metadata
            },
            input: generateDiffTreeParams,
            output: diffResult,
            summary: {
                hasChanges: diffResult.success && diffResult.tree && Object.keys(diffResult.tree).length > 0,
                changeCount: diffResult.statistics?.totalChanges || 0,
                addedCount: diffResult.statistics?.added || 0,
                modifiedCount: diffResult.statistics?.modified || 0,
                deletedCount: diffResult.statistics?.deleted || 0
            }
        };
        
        logger.info('成功生成测试用例', {
            testId: testCase.metadata.testId,
            hasChanges: testCase.summary.hasChanges,
            changeCount: testCase.summary.changeCount
        });
        
        return testCase;
        
    } catch (error) {
        logger.error('生成测试用例失败', error);
        throw new Error(`生成测试用例失败: ${error.message}`);
    }
}

/**
 * 批量生成多个测试用例
 * @param {Array} configs - 配置数组
 * @param {Logger} logger - 日志记录器
 * @returns {Array} 测试用例数组
 */
async function generateMultipleTestCases(configs, logger) {
    logger.info(`开始批量生成 ${configs.length} 个测试用例`);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        try {
            logger.info(`生成第 ${i + 1}/${configs.length} 个测试用例`);
            const testCase = await generateTestCase(config, logger);
            results.push(testCase);
            
            // 添加延迟避免数据库压力过大
            if (i < configs.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            logger.error(`第 ${i + 1} 个测试用例生成失败`, error);
            errors.push({
                index: i,
                config,
                error: error.message
            });
        }
    }
    
    logger.info(`批量生成完成: 成功 ${results.length} 个，失败 ${errors.length} 个`);
    
    return {
        success: results,
        errors,
        summary: {
            total: configs.length,
            successCount: results.length,
            errorCount: errors.length
        }
    };
}

/**
 * 预定义的测试配置模板
 */
const TEST_TEMPLATES = {
    // 基础随机对比测试
    basic_random: {
        strategy: 'random',
        fetchOptions: {
            excludeFields: ['_createTime', '_updateTime', 'lastUpdateTime']
        },
        diffOptions: {
            includeUnchanged: false,
            enableDiagnostics: true
        }
    },
    
    // 最新记录对比测试
    latest_comparison: {
        strategy: 'latest',
        fetchOptions: {
            timeField: '_createTime',
            excludeFields: ['_updateTime', 'lastUpdateTime']
        },
        diffOptions: {
            includeUnchanged: true,
            maxDepth: 5
        }
    },
    
    // 版本对比测试
    version_comparison: {
        strategy: 'version_compare',
        fetchOptions: {
            businessIdField: 'businessId',
            versionField: 'version'
        },
        diffOptions: {
            ignoreFields: ['_id', '_createTime', '_updateTime', 'version'],
            includeUnchanged: false,
            enableDiagnostics: true
        }
    },
    
    // 深度对比测试
    deep_comparison: {
        strategy: 'random',
        fetchOptions: {
            removeNullValues: true,
            removeEmptyStrings: true
        },
        diffOptions: {
            maxDepth: 20,
            arrayComparison: 'content',
            includeUnchanged: true,
            enableDiagnostics: true
        }
    }
};

/**
 * 使用模板快速生成测试用例
 * @param {string} objectApiName - 业务对象API名称
 * @param {string} templateName - 模板名称
 * @param {Object} overrides - 覆盖配置
 * @param {Logger} logger - 日志记录器
 * @returns {Object} 测试用例
 */
async function generateFromTemplate(objectApiName, templateName, overrides = {}, logger) {
    const template = TEST_TEMPLATES[templateName];
    if (!template) {
        throw new Error(`未找到模板: ${templateName}。可用模板: ${Object.keys(TEST_TEMPLATES).join(', ')}`);
    }
    
    const config = {
        objectApiName,
        ...template,
        ...overrides,
        fetchOptions: { ...template.fetchOptions, ...overrides.fetchOptions },
        diffOptions: { ...template.diffOptions, ...overrides.diffOptions }
    };
    
    return await generateTestCase(config, logger);
}

module.exports = {
    generateTestCase,
    generateMultipleTestCases,
    generateFromTemplate,
    TEST_TEMPLATES
};