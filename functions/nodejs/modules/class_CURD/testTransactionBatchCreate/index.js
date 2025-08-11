/**
 * 测试事务批量创建的返回值 - 对比事务前后registerResult的变化
 * 根据文档：https://bytedance.larkoffice.com/wiki/CmRmwVUz0i8taWk0fbRcpDeHn6f
 * registerBatchCreate() 应该返回 ids []
 */

module.exports = async function(params, context, logger) {
    const { objectApiName, records } = params;
    logger.info('params:', params);
    logger.info('🚀 开始测试事务批量创建的返回值 - 对比事务前后变化');
    logger.info('📊 测试对象:', objectApiName);
    logger.info('📝 测试记录:', JSON.stringify(records, null, 2));
    
    // 创建事务
    const tx = application.data.newTransaction();
    logger.info('✅ 事务创建成功');
    
    // 注册批量创建操作
    logger.info('🔄 开始注册批量创建操作...');
    const registerResult = tx.object(objectApiName).registerBatchCreate(records);
    
    // 深度复制事务提交前的registerResult状态
    const registerResultBeforeCommit = JSON.parse(JSON.stringify(registerResult));
    
    logger.info('📤 【事务提交前】registerBatchCreate 返回值类型:', typeof registerResult);
    logger.info('📤 【事务提交前】registerBatchCreate 返回值是否为数组:', Array.isArray(registerResult));
    logger.info('📤 【事务提交前】registerBatchCreate 返回值内容（UUID格式）:', JSON.stringify(registerResult, null, 2));
    
    // 提取事务提交前的ID值（应该是UUID格式）
    const idsBeforeCommit = Array.isArray(registerResult) 
        ? registerResult.map(item => item._id || item.id || item) 
        : [registerResult._id || registerResult.id || registerResult];
    
    logger.info('📤 【事务提交前】提取的ID数组:', JSON.stringify(idsBeforeCommit, null, 2));
    
    // 提交事务
    logger.info('🔄 开始提交事务...');
    const commitResult = await tx.commit();
    
    logger.info('✅ 事务提交成功');
    logger.info('📤 commit 返回值类型:', typeof commitResult);
    logger.info('📤 commit 返回值内容:', JSON.stringify(commitResult, null, 2));
    
    // 检查事务提交后registerResult的变化
    logger.info('🔍 【事务提交后】registerBatchCreate 返回值类型:', typeof registerResult);
    logger.info('🔍 【事务提交后】registerBatchCreate 返回值是否为数组:', Array.isArray(registerResult));
    logger.info('🔍 【事务提交后】registerBatchCreate 返回值内容（应为真实ID）:', JSON.stringify(registerResult, null, 2));
    
    // 提取事务提交后的ID值（应该是真实的数据库ID）
    const idsAfterCommit = Array.isArray(registerResult) 
        ? registerResult.map(item => item._id || item.id || item) 
        : [registerResult._id || registerResult.id || registerResult];
    
    logger.info('🔍 【事务提交后】提取的ID数组:', JSON.stringify(idsAfterCommit, null, 2));
    
    // 对比分析
    logger.info('🔄 ========== 事务前后对比分析 ==========');
    logger.info('📊 事务提交前ID:', JSON.stringify(idsBeforeCommit, null, 2));
    logger.info('📊 事务提交后ID:', JSON.stringify(idsAfterCommit, null, 2));
    
    // 检查ID是否发生变化
    const idsChanged = JSON.stringify(idsBeforeCommit) !== JSON.stringify(idsAfterCommit);
    logger.info('🔍 ID是否发生变化:', idsChanged);
    
    if (idsChanged) {
        logger.info('✅ 验证成功：事务提交后，registerResult中的ID从UUID转换为真实数据库ID');
        idsBeforeCommit.forEach((beforeId, index) => {
            const afterId = idsAfterCommit[index];
            logger.info(`📋 记录${index + 1}: ${beforeId} → ${afterId}`);
        });
    } else {
        logger.warn('⚠️ 注意：事务提交前后ID未发生变化，可能存在问题');
    }
    
    // 返回详细的对比结果
    return {
        testInfo: {
            objectApiName: objectApiName,
            recordCount: records.length,
            testTime: new Date().toISOString()
        },
        registerResultBeforeCommit: registerResultBeforeCommit,
        registerResultAfterCommit: registerResult,
        commitResult: commitResult,
        comparison: {
            idsBeforeCommit: idsBeforeCommit,
            idsAfterCommit: idsAfterCommit,
            idsChanged: idsChanged,
            changeDetails: idsChanged ? idsBeforeCommit.map((beforeId, index) => ({
                index: index,
                before: beforeId,
                after: idsAfterCommit[index],
                isUuidBefore: typeof beforeId === 'string' && beforeId.includes('-'),
                isNumberAfter: typeof idsAfterCommit[index] === 'number'
            })) : null
        }
    };
};