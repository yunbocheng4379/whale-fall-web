import request from '@/utils/request';

export default {
  simpleChat(query) {
    return request({
      url: '/ai/chat/stream',
      method: 'GET',
      params: { query: query },
    });
  },
};
