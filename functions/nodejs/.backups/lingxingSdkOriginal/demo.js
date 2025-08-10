// OpenAPI接入指南, 示例
import { generateAccessToken, refreshToken, httpRequest } from "./src/openapi.js"

const appId = 'xxxxxx' // 企业的AppID,申请后在ERP中获取
const appSecret = 'xxxxxxxxxxxx' // 企业的AppSecret,申请后在ERP中获取

const getPath = '/erp/sc/routing/data/local_inventory/category' // GET请求路由路径示例
const getParams =  { offset: 5 } // GET请求参数示例

const postPath = '/bd/sp/api/open/settlement/summary/list' // POST请求路由路径示例
const postParams = { dateType: 1, startDate: '2022-09-21', endDate: '2022-09-25' } // POST请求参数示例

async function main() {
  // 根据appId和appSecret获取access-token和refresh-token示例
  const data = await generateAccessToken(appId, appSecret)

  // POST请求业务接口示例
  await httpRequest(postPath, 'post', appId, data ? data.access_token : '', postParams)

  // GET请求业务接口示例
  await httpRequest(getPath, 'get', appId, data ? data.access_token : '', getParams)

  // 刷新token示例
  await refreshToken(appId, data ? data.refresh_token : '')
}

main()