import axios from 'axios';

/**
 * 封装简单的请求示例方法
 * @param {string} url 请求完整路径
 * @param {string} method 请求类型：post、get等
 * @param {Object} params 请求参数
 * @param {Object} headers 请求头额外参数
 * @returns Promise
 */
export function baseRequest(url, method, params, headers) {
  const [_params, _data] = method.toUpperCase() === 'GET' ? [params, ''] : ['', params]
  console.log('url=', url, params)
  return new Promise((resolve, reject) => {
    axios({
      url: url,
      method: method,
      params: _params,
      data: _data,
      headers: headers || {}
    }).then(res => {
      const data = res.data
      console.log('result=', data)
      resolve(data)
    }).catch(err => {
      console.error('接口异常，' + err)
      reject(err)
    })
  })
}

/**
 * 封装简单的post请求示例方法
 * @param {string} url 请求完整路径
 * @param {Object} params 请求参数
 * @returns Promise
 */
export function post(url, params, headers) {
  return baseRequest(url, 'POST', params, headers)
}

/**
 * 封装简单的get请求示例方法
 * @param {string} url 请求完整路径
 * @param {Object} params 请求参数
 * @returns Promise
 */
export function get(url, params) {
  return baseRequest(url, 'GET', params)
}