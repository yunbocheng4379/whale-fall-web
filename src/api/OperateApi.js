import request from '@/utils/request';

export default {
  // 操作日志分页查询
  getOperateLogs(data) {
    return request({
      url: '/log-center/operate/page',
      method: 'POST',
      data,
    });
  },
};
