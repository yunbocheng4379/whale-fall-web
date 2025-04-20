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

  getMenu(data) {
    return request({
      url: '/user/getMenu',
      method: 'POST',
      data,
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

  getGitLabURL() {
    return request({
      url: '/user/getGitLabURL',
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

  verifyAccount(account) {
    return request({
      url: '/user/verifyAccount?account=' + account,
      method: 'GET',
    });
  },

  resetPassword(data) {
    return request({
      url: 'user/resetPassword',
      method: 'POST',
      data,
    });
  },

  uploadAvatar(data) {
    return request({
      url: '/user/uploadAvatar',
      method: 'POST',
      data,
    });
  },

  verifyResetCode(data) {
    return request({
      url: 'user/verifyResetCode',
      method: 'POST',
      data,
    });
  },

  sendResetCode(email) {
    return request({
      url: 'user/sendResetCode?email=' + email,
      method: 'GET',
    });
  },
};
