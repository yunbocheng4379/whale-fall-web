import { BACK_PORT } from '@/config';

/**
 * 获取基础URL
 * 根据当前环境（开发/生产）返回对应的后端服务地址
 * @returns {string} 基础URL
 */
export function getBaseURL() {
  let baseURL = '';
  if (!/:/i.test(window.location.host)) {
    baseURL = 'http://' + window.location.host; // 正式环境
  } else {
    baseURL = 'http://' + window.location.hostname + ':' + BACK_PORT; // 开发环境
  }
  return baseURL;
}
