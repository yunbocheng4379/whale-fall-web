import request from '@/utils/request';

export default {
  // 根据知识库ID获取文档列表（复用现有知识库详情接口或后端文档接口）
  getDocumentsByKnowledgeId(data) {
    return request({
      url: 'document/getDocumentListById',
      method: 'POST',
      data,
    });
  },

  // 上传文档（支持文件流），onUploadProgress 为 axios 回调
  // 新增 isTemplate 参数，用于区分是否为模板/本地上传（true）或知识库文档（false）
  uploadDocument(formData, knowledgeId, onUploadProgress, isTemplate = false) {
    // 确保知识库ID被包含在表单数据中（如果提供）
    try {
      if (knowledgeId && formData && !formData.has('knowledgeId')) {
        formData.append('knowledgeId', knowledgeId);
      }
    } catch (e) {
      // ignore if formData is not FormData
    }

    // 始终将 isTemplate 标记包含到表单（后端可根据该字段把文件存入不同表）
    try {
      if (formData && !formData.has('isTemplate')) {
        formData.append('isTemplate', isTemplate ? 'true' : 'false');
      }
    } catch (e) {
      // ignore
    }

    return request({
      url: 'document/upload',
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      onUploadProgress,
    });
  },
  // 获取文档原始文本内容（用于预览 / 复制）
  getOriginalContent(payload) {
    return request({
      url: 'document/getOriginalContent',
      method: 'POST',
      data: payload,
    });
  },

  // 下载文档原始文件（返回二进制）
  downloadOriginal(payload) {
    return request({
      url: 'document/downloadOriginal',
      method: 'POST',
      data: payload,
      responseType: 'blob',
    });
  },

  // 删除文档
  deleteDocument(documentId) {
    return request({
      url: 'document/delete',
      method: 'DELETE',
      params: { documentId },
    });
  },
};
