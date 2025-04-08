import request from '@/utils/request';

export default {
  loginByPhone(data) {
    return request({
      url: 'user/loginByPhone',
      method: 'POST',
      data,
    });
  },

  loginByEmail(data) {
    return request({
      url: 'user/loginByEmail',
      method: 'POST',
      data,
    });
  },

  loginByAccount(data) {
    return request({
      url: 'user/loginByAccount',
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

  register(data) {
    return request({
      url: 'user/register',
      method: 'POST',
      data,
    });
  },
};
