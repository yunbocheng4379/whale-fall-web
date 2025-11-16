import request from '@/utils/request';

export default {
  getCategories() {
    return request({
      url: '/ledger/getCategories',
      method: 'GET',
    });
  },
  getPersonalLedger(data) {
    return request({
      url: '/ledger/getPersonalLedger',
      method: 'POST',
      data,
    });
  },
  addLedger(data) {
    return request({
      url: '/ledger/addLedger',
      method: 'POST',
      data,
    });
  },
  updateLedger(data) {
    return request({
      url: '/ledger/updateLedger',
      method: 'POST',
      data,
    });
  },
  deleteLedger(id) {
    return request({
      url: '/ledger/deleteLedger',
      method: 'POST',
      data: { id },
    });
  },
};
