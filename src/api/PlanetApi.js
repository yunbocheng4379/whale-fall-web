import request from '@/utils/request';

export default {
  /**
   * 分页查询知识卡片列表
   */
  getKnowledgeCardPage(data) {
    return request({
      url: '/planet/list',
      method: 'POST',
      data,
    });
  },

  /**
   * 获取知识卡片详情
   */
  getKnowledgeCardById(id) {
    return request({
      url: `/planet/detail/${id}`,
      method: 'GET',
    });
  },

  /**
   * 新增知识卡片
   */
  addKnowledgeCard(data) {
    return request({
      url: '/planet/add',
      method: 'POST',
      data,
    });
  },

  /**
   * 更新知识卡片
   */
  updateKnowledgeCard(data) {
    return request({
      url: '/planet/update',
      method: 'POST',
      data,
    });
  },

  /**
   * 删除知识卡片
   */
  deleteKnowledgeCard(id) {
    return request({
      url: `/planet/delete/${id}`,
      method: 'DELETE',
    });
  },

  /**
   * 获取热门知识卡片
   */
  getHotKnowledgeCards(limit) {
    return request({
      url: '/planet/hot',
      method: 'GET',
      params: { limit },
    });
  },

  /**
   * 获取我的知识卡片
   */
  getMyKnowledgeCards() {
    return request({
      url: '/planet/my',
      method: 'GET',
    });
  },

  /**
   * 获取卡片附件
   */
  getCardAttachments(cardId) {
    return request({
      url: `/planet/attachments/${cardId}`,
      method: 'GET',
    });
  },

  /**
   * 上传文件
   */
  uploadFile(file, cardId) {
    const formData = new FormData();
    formData.append('file', file);
    if (cardId) {
      formData.append('cardId', cardId);
    }
    return request({
      url: '/planet/upload',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * 获取所有标签列表
   */
  getAllTags() {
    return request({
      url: '/planet/tags',
      method: 'GET',
    });
  },
};
