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

  sendSmsCode(phone) {
    return request({
      url: '/user/sendSmsCode?phone=' + phone,
      method: 'GET',
    });
  },

  getGithubLoginURL() {
    return request({
      url: '/user/getGithubLoginURL',
      method: 'GET',
    });
  },

  getGiteeLoginURL() {
    return request({
      url: '/user/getGiteeLoginURL',
      method: 'GET',
    });
  },

  getFeiShuLoginURL() {
    return request({
      url: '/user/getFeiShuLoginURL',
      method: 'GET',
    });
  },

  getGitLibURL() {
    return request({
      url: '/user/getGitLibURL',
      method: 'GET',
    });
  },
};
