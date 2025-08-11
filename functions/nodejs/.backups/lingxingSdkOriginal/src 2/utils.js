import md5 from "md5";
import CryptoJS  from "crypto-js";
import Qs from 'qs';

/**
 * AES/ECB/PKCS5PADDING加密
 * @param {*} content 加密的内容
 * @param {*} appKey aes加密的密码
 * @returns 加密后的字符串
 */
function encrypt(content, appKey) {
  const _key = CryptoJS.enc.Utf8.parse(appKey)
  const encryptedECB = CryptoJS.AES.encrypt(content.trim(), _key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encryptedECB.toString()
}

/**
 * 根据params生成签名
 * @param {Object} params 参数
 * @param {string} appKey 生成的16位appKey
 * @returns 签名字符串
 */
export function generateSign(params, appKey) {
  const paramsArr = Object.keys(params).sort();
  const stringArr = paramsArr.map(key => {
    const value = isPlainObject(params[key]) ? JSON.stringify(params[key]) : String(params[key])
    return `${key}=${value}`
  })
  const paramsUrl = stringArr.join('&')
  const upperUrl = md5(paramsUrl).toString().toUpperCase()
  const encryptedString = encrypt(upperUrl, appKey)
  return encryptedString
}

/**
 * 对URL处理成REST模式，并对参数编码
 * @param {string} url 请求URL
 * @param {Object} params 请求参数
 * @returns 完整带参数的URL
 */
export function restQueryUrl(url, params) {
  const paramsUrl = Qs.stringify(params)
  return `${url}${paramsUrl? '?': ''}${paramsUrl}`
}

/**
 * 判断指定参数是否是一个纯粹的对象或数组
 * @param {all} val 
 * @returns true or false
 */
function isPlainObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]' || Array.isArray(val)
}

