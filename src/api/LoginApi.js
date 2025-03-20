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
      url: '/user/getMenu?username=' + username,
      method: 'GET',
    });
  },

  sendVerificationCode(email) {
    return request({
      url: '/user/sendVerificationCode?email=' + email,
      method: 'GET',
    });
  },
};
