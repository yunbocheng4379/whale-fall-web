import request from '@/utils/request';

export default {
  login(data) {
    return request({
      url: 'user/login',
      method: 'POST',
      data,
    });
  },

  getMenu(username) {
    return request({
      url: 'user/getMenu',
      method: 'POST',
      data: username,
    });
  },
};
