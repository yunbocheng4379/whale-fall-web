import request from '@/utils/request';

export default {
  // 获取知识库列表
  getKnowledgeList(data) {
    return request({
      url: 'knowledge/getKnowledgeList',
      method: 'POST',
      data: data,
    });
  },

  // 新增文库
  addKnowledge(data) {
    return request({
      url: 'knowledge/addKnowledge',
      method: 'POST',
      data: data,
    });
  },

  // 删除文库
  deleteKnowledge(data) {
    return request({
      url: 'knowledge/deleteKnowledge',
      method: 'POST',
      data: data,
    });
  },
};


