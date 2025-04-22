import request from '@/utils/request';

export default {
  getCurrentUserInfo(username) {
    return request({
      url: 'account/getCurrentUserInfo?username=' + username,
      method: 'GET',
    });
  },

  sendResetEmailCode(email) {
    return request({
      url: 'account/sendResetEmailCode?email=' + email,
      method: 'GET',
    });
  },

  sendResetSmsCode(phone) {
    return request({
      url: 'account/sendResetSmsCode?phone=' + phone,
      method: 'GET',
    });
  },

  verifyEmailCode(data) {
    return request({
      url: 'account/verifyEmailCode',
      method: 'POST',
      data,
    });
  },

  verifyPhoneCode(data) {
    return request({
      url: 'account/verifyPhoneCode',
      method: 'POST',
      data,
    });
  },

  updateByEmail(data) {
    return request({
      url: 'account/updateByEmail',
      method: 'POST',
      data,
    });
  },

  updateByPhone(data) {
    return request({
      url: 'account/updateByPhone',
      method: 'POST',
      data,
    });
  },

  updateByPassword(data) {
    return request({
      url: 'account/updateByPassword',
      method: 'POST',
      data,
    });
  },
};
