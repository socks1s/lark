/**
 * @description 计算物流费均摊的云函数
 * @param {Object} params - 参数对象，包含总重量、费率、重量明细、体积明细和分摊方式
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回各分票分摊金额和总运费
 */
module.exports = async function (params, context, logger) {
    // 从参数中解构出所需字段
    const { 
        totalWeight, 
        rate, 
        weightList, 
        volumeList, 
        allocationMethod 
    } = params;

    // 检查输入参数
    if (!totalWeight || !rate || !weightList || !volumeList || !allocationMethod) {
        throw new Error("所有参数都是必需的");
    }
    if (!Array.isArray(weightList) || !Array.isArray(volumeList)) {
        throw new Error("重量明细和体积明细必须是数组");
    }
    if (weightList.length !== volumeList.length) {
        throw new Error("重量明细和体积明细数量不一致");
    }
    if (allocationMethod !== 'weight' && allocationMethod !== 'volume') {
        throw new Error("分摊方式必须是'weight'或'volume'");
    }

    try {
        // 计算总运费
        const totalFreight = totalWeight * rate;
        
        // 根据分摊方式选择计算基准列表
        const allocationList = allocationMethod === 'weight' ? weightList : volumeList;
        
        // 计算基准列表总和
        const totalAllocation = allocationList.reduce((sum, val) => sum + val, 0);
        
        // 处理总和为0的特殊情况
        if (totalAllocation === 0) {
            return {
                allocatedAmounts: new Array(allocationList.length).fill(0),
                totalFreight: 0
            };
        }

        // 计算各分票分摊金额
        const allocatedAmounts = allocationList.map(val => {
            const ratio = val / totalAllocation;
            return ratio * totalFreight;
        });

        logger.info("物流费均摊计算完成", { 
            totalWeight,
            rate,
            allocationMethod,
            totalFreight,
            allocatedAmounts
        });

        return {
            allocatedAmounts,
            totalFreight
        };
    } catch (error) {
        logger.error("物流费均摊计算失败", error);
        throw new Error("物流费均摊计算过程中出现错误");
    }
}
