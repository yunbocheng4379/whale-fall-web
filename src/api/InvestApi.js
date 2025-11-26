import request from '@/utils/request';

export default {
  getInvestRecords() {
    return request({
      url: '/investment/getInvestRecords',
      method: 'GET',
    });
  },
  getInvestmentInfo(data) {
    return request({
      url: '/investment/getInvestmentInfo',
      method: 'POST',
      data,
    });
  },
  addInvestment(data) {
    return request({
      url: '/investment/addInvestment',
      method: 'POST',
      data,
    });
  },
  updateInvestment(data) {
    return request({
      url: '/investment/updateInvestment',
      method: 'POST',
      data,
    });
  },
  deleteInvestment(id) {
    return request({
      url: '/investment/deleteInvestment',
      method: 'POST',
      data: { id },
    });
  },
};
