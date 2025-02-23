import {history} from "umi";
import {message} from "antd";
import axios from "axios";
import {getToken, removeToken, TOKEN_KEY} from "@/utils/tokenUtil";
import {SUCCESS_CODE, UNAUTHORIZED_CODE} from "@/utils/enums/codeEnums";
import {LOGIN_PATH} from "@/utils/enums/pathEnums";

let baseURL = 'http://' + window.location.hostname + ':' + window.location.port

const instance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
})

// 请求拦截器
instance.interceptors.request.use(config => {
  if (getToken()) {
    config.headers[TOKEN_KEY] = getToken()
  }
  return config
}, error => {
  return Promise.reject(error)
})

// 响应拦截器
instance.interceptors.response.use(response => {
  if (!response.data) {
    message.error('服务器缺少响应数据')
    return
  }
  const {code, message: msg} = response.data
  if (code === UNAUTHORIZED_CODE) {
    if (getToken()) {
      removeToken()
    }
    history.push(LOGIN_PATH)
    return Promise.reject(msg)
  }
  if (code !== SUCCESS_CODE && msg) {
    message.error(msg)
  }
  return response.data
}, error => {
  console.log(error.response) // debug
  message.error('服务器响应错误')
  return Promise.reject(error)
})

export default instance
