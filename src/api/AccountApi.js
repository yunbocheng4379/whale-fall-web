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

  updateByAvatarUrl(data) {
    return request({
      url: 'account/updateByAvatarUrl',
      method: 'POST',
      data,
    });
  },

  handleUnBind(data) {
    return request({
      url: 'account/handleUnBind',
      method: 'POST',
      data,
    });
  },

  deleteAccount(data) {
    return request({
      url: 'account/deleteAccount',
      method: 'POST',
      data,
    });
  },

  queryDailyMessages(data) {
    return request({
      url: 'account/queryDailyMessages',
      method: 'POST',
      data,
    });
  },

  getMessageByUserName(username) {
    return request({
      url: 'account/getMessageByUserName?username=' + username,
      method: 'GET',
    });
  },

  getMessageStatusInfo(username) {
    return request({
      url: 'account/getMessageStatusInfo?username=' + username,
      method: 'GET',
    });
  },
};
