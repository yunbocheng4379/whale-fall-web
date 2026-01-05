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
  uploadDocument(formData, knowledgeId, onUploadProgress) {
    // 确保知识库ID被包含在表单数据中
    if (knowledgeId && !formData.has('knowledgeId')) {
      formData.append('knowledgeId', knowledgeId);
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


