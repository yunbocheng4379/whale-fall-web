import { LOGIN_PATH, TOKEN_KEY } from '@/config';
import { JWT_FAIL_CODE, JWT_LOSE_CODE, SUCCESS_CODE } from '@/config/code';
import { getToken, removeToken } from '@/utils/tokenUtil';
import { getBaseURL } from '@/utils/urlUtil';
import { message } from 'antd';
import axios from 'axios';
import { history } from 'umi';

// 获取基础URL
const baseURL = getBaseURL();

const instance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    if (getToken()) {
      config.headers[TOKEN_KEY] = getToken();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    if (!response.data) {
      message.error('服务器缺少响应数据');
      return;
    }
    const { code, message: msg } = response.data;
    if (code === JWT_LOSE_CODE || code === JWT_FAIL_CODE) {
      message.warning(msg);
      if (getToken()) {
        removeToken();
      }
      history.push(LOGIN_PATH);
      return Promise.reject(msg);
    }
    if (code !== SUCCESS_CODE && msg) {
      message.warning(msg);
    }
    return response.data;
  },
  (error) => {
    console.log(error.response);
    message.error('服务器响应错误');
    return Promise.reject(error);
  },
);

export default instance;
export { baseURL };
