import request from '@/utils/request';

export default {
  // 获取模型列表（分页查询）
  getModelList(params) {
    return request({
      url: 'model/list',
      method: 'POST',
      data: params,
    });
  },

  // 新增模型
  addModel(data) {
    return request({
      url: 'model/add',
      method: 'POST',
      data,
    });
  },

  // 更新模型
  updateModel(data) {
    return request({
      url: 'model/update',
      method: 'POST',
      data,
    });
  },

  // 删除模型
  deleteModel(id) {
    return request({
      url: 'model/delete',
      method: 'POST',
      data: { id },
    });
  },

  // 根据ID获取模型详情
  getModelById(id) {
    return request({
      url: 'model/detail',
      method: 'GET',
      params: { id },
    });
  },

  // 获取全部模型（非分页），用于客户端下拉选择
  getAllModels() {
    return request({
      url: 'model/listAll',
      method: 'POST',
    });
  },
};
