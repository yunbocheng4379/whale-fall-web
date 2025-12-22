import request from '@/utils/request';

export default {
  // 登录日志分页查询
  getLoginLogs(data) {
    return request({
      url: '/log-center/login/page',
      method: 'POST',
      data,
    });
  },
};
