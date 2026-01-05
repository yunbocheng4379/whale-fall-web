import request from '@/utils/request';

export default {
  // 获取提示词列表
  getPromptList(data) {
    return request({
      url: 'prompt/getPromptList',
      method: 'POST',
      data,
    });
  },

  // 根据ID获取提示词详情
  getPromptById(data) {
    return request({
      url: 'prompt/getPromptById',
      method: 'POST',
      data,
    });
  },

  // 新增提示词
  addPrompt(data) {
    return request({
      url: 'prompt/addPrompt',
      method: 'POST',
      data,
    });
  },

  // 更新提示词
  updatePrompt(data) {
    return request({
      url: 'prompt/updatePrompt',
      method: 'POST',
      data,
    });
  },

  // 删除提示词
  deletePrompt(data) {
    return request({
      url: 'prompt/deletePrompt',
      method: 'POST',
      data,
    });
  },
};
