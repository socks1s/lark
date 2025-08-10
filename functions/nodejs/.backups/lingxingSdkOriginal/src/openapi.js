import { baseRequest, post } from './request.js';
import { generateSign, restQueryUrl } from './utils.js'
const BASE_HOST = 'https://openapi.lingxing.com'

/**
 * 根据请求参数获取对应的数据，业务接口
 * @param {string} routeName  功能接口地址(API Path)
 * @param {string} method post/get
 * @param {string} appId 企业的AppID,申请后在ERP中获取
 * @param {string} accessToken 通过access-token接口请求返回的access-token字段
 * @param {Object} params 额外的参数
 * @returns 成功的数据或null
 */
export async function httpRequest(routeName, method, appId, accessToken, params) {
  const baseParam = {
    'access_token': accessToken,
    'app_key': appId,
    timestamp: Math.round(new Date().getTime()/1000)
  };
  const signParams = Object.assign({}, baseParam, params)
  // 使用apiId对query参数和基础字段进行签名
  const sign = generateSign(signParams, appId)
  baseParam.sign = sign
  let url = BASE_HOST + routeName
  let headers = {}
  let queryParam = params
  if (method.toUpperCase() !== 'GET') {
    headers = {
      "Content-Type": "application/json"
    }
    // post、put请求需要格式化基础的参数成REST模式
    url = restQueryUrl(url, baseParam)
  } else {
    // get请求直接把参数放在params里
    queryParam = Object.assign({}, params, baseParam)
  }

  const { data, code } = await baseRequest(url, method, queryParam, headers)
  // 这里可以对异常code进行处理判断
  // if (Number(code) !== 0) {
  //   console.log(data.throwable)
  //   return
  // }
  return data
}

/**
 * 根据appId和appSecret获取access-token和refresh-token
 * @param {string} appId 企业的AppID,申请后在ERP中获取
 * @param {string} appSecret 企业的AppSecret,申请后在ERP中获取
 * @returns 成功的数据或null
 */
export async function generateAccessToken(appId, appSecret) {
  const path = '/api/auth-server/oauth/access-token';
  const params = {
    appId,
    appSecret
  };
  const postUrl = restQueryUrl(BASE_HOST + path, params)
  const { data, code } = await post(postUrl);
  if (Number(code) !== 200) {
    console.log(data.throwable)
    return
  }
  return data
}

/**
 * 刷新token（token续约，每个refreshToken只能用一次）
 * @param {string} appId 企业的AppID
 * @param {string} refreshToken 通过access-token接口请求返回的refresh_token字段
 * @returns 成功的数据或null
 */
export async function refreshToken(appId, refreshToken) {
  const path = '/api/auth-server/oauth/refresh';
  const params = {
    appId,
    refreshToken
  };
  const postUrl = restQueryUrl(BASE_HOST + path, params)
  const { data, code } = await post(postUrl);
  if (Number(code) !== 200) {
    console.log(data.throwable)
    return
  }
  return data
}