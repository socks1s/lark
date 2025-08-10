// 通过 NPM dependencies 成功安装 NPM 包后此处可引入使用
// 如安装 linq 包后就可以引入并使用这个包
// const linq = require("linq");

/**
 * @param {Params}  params     自定义参数
 * @param {Context} context    上下文参数，可通过此参数下钻获取上下文变量信息等
 * @param {Logger}  logger     日志记录器
 *
 * @return 函数的返回数据
 */

module.exports = async function (params, context, logger) {
  const { 
    oldList,//老的列表
    newList//新的列表
  } = params;
  
  const newIdSet = new Set(newList.map(item => item._id));//  1. 创建新列表ID的哈希集合

  // 2. 初始化双指针
  let slow = 0; // 有效元素指针
  let fast = 0; // 遍历指针

  // 3. 单次遍历处理
  while (fast < oldList.length) {
    // 检查当前元素的_id是否不存在于新列表
    if (!newIdSet.has(oldList[fast]._id)) {
      // 保留不存在的元素
      oldList[slow] = oldList[fast];
      slow++;
    }
    fast++;
  }
 
  // 4. 截断无效元素
  oldList.length = slow;//因为这个listOld是老List改造而来的，所以需要截断。
  const delList = oldList;
  console.log('del:'+delList)
  return { delList };
}
