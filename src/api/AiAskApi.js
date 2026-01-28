import { TOKEN_KEY } from '@/config';
import { getToken } from '@/utils/tokenUtil';
import { getBaseURL } from '@/utils/urlUtil';

/**
 * 创建SSE连接进行流式聊天
 * @param {string} message - 用户消息
 * @param {string} sessionId - 会话ID（可选）
 * @param {string} modelId - 模型ID（可选）
 * @param {Object} docParams - 文档参数（可选）
 * @param {Function} onMessage - 消息回调函数
 * @param {Function} onError - 错误回调函数
 * @param {Function} onComplete - 完成回调函数
 * @returns {Object} 包含close方法的控制器对象
 */
export function createChatStream(
  message,
  sessionId,
  modelId,
  knowledgeBaseId,
  docParams,
  onMessage,
  onError,
  onComplete,
) {
  const baseURL = getBaseURL();
  const token = getToken();

  // 构建 POST 请求体：将 message、sessionId、modelId、本地文件 id 列表 与 知识库文档 id 列表
  const chatRequestParams = {
    message: message,
  };

  if (sessionId) chatRequestParams.sessionId = sessionId;
  if (modelId) chatRequestParams.modelId = modelId;

  // 映射 docParams 到后端约定字段名，同时传递 knowledgeBaseId（如果有）
  if (
    docParams &&
    Array.isArray(docParams.selectedLocalTempFileIds) &&
    docParams.selectedLocalTempFileIds.length > 0
  ) {
    chatRequestParams.tempFileIds = docParams.selectedLocalTempFileIds;
  } else {
    chatRequestParams.tempFileIds = [];
  }

  if (
    docParams &&
    Array.isArray(docParams.selectedKnowledgeDocIds) &&
    docParams.selectedKnowledgeDocIds.length > 0
  ) {
    chatRequestParams.knowledgeIdFiles = docParams.selectedKnowledgeDocIds;
  } else {
    chatRequestParams.knowledgeIdFiles = [];
  }

  if (knowledgeBaseId) {
    chatRequestParams.knowledgeBaseId = knowledgeBaseId;
  }

  const url = `${baseURL}/ai/chat`;

  const abortController = new AbortController();
  let isAborted = false;

  let buffer = '';
  let reader = null;

  fetch(url, {
    method: 'POST',
    headers: {
      [TOKEN_KEY]: token || '',
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chatRequestParams),
    signal: abortController.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();

      function readStream() {
        if (isAborted) {
          return;
        }

        reader
          .read()
          .then(({ done, value }) => {
            if (isAborted) {
              return;
            }

            if (done) {
              // 处理剩余的buffer
              if (buffer.trim()) {
                // 处理所有剩余的数据
                processBuffer();
              }
              if (onComplete) {
                onComplete();
              }
              return;
            }

            // 解码数据 - 立即解码，不等待
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 立即处理buffer中所有完整的数据块 - 关键：每次收到数据就立即处理
            processBuffer();

            // 立即继续读取下一个数据块，不等待
            readStream();
          })
          .catch((error) => {
            if (!isAborted && onError) {
              onError(error);
            }
          });
      }

      // 处理buffer，直接处理原始数据，无需SSE格式处理
      // 后端直接返回 JSON 字符串，如 {"data":"..."}
      function processBuffer() {
        // 尝试查找完整的 JSON 对象
        // JSON 对象以 { 开始，以 } 结束
        while (true) {
          const startIndex = buffer.indexOf('{');
          if (startIndex === -1) {
            // 没有找到 JSON 开始标记，清空buffer
            buffer = '';
            break;
          }

          // 从 { 开始查找匹配的 }
          let braceCount = 0;
          let endIndex = -1;

          for (let i = startIndex; i < buffer.length; i++) {
            if (buffer[i] === '{') {
              braceCount++;
            } else if (buffer[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
          }

          if (endIndex === -1) {
            // 没有找到完整的 JSON 对象，保留等待
            buffer = buffer.substring(startIndex);
            break;
          }

          // 提取完整的 JSON 字符串
          const jsonStr = buffer.substring(startIndex, endIndex + 1);

          // 立即调用回调，传递原始 JSON 字符串
          if (jsonStr && jsonStr.trim()) {
            onMessage(jsonStr);
          }

          // 移除已处理的部分
          buffer = buffer.substring(endIndex + 1);

          // 继续处理buffer中剩余的数据（可能一次收到了多个JSON对象）
        }
      }

      readStream();
    })
    .catch((error) => {
      if (!isAborted && onError) {
        // 如果是取消错误，不触发错误回调
        if (error.name !== 'AbortError') {
          onError(error);
        }
      }
    });

  // 返回一个可以关闭的对象
  return {
    close: () => {
      isAborted = true;
      try {
        abortController.abort();
      } catch (e) {
        // ignore
      }
      if (reader && typeof reader.cancel === 'function') {
        // cancel may return a promise that rejects with AbortError; swallow it to avoid unhandled rejection
        try {
          const cancelResult = reader.cancel();
          if (cancelResult && typeof cancelResult.then === 'function') {
            cancelResult.catch(() => {});
          }
        } catch (ex) {
          // ignore
        }
      }
    },
  };
}

/**
 * 获取聊天历史记录
 * @returns {Promise} 返回历史记录列表
 */
export function getChatHistory() {
  const baseURL = getBaseURL();
  const token = getToken();

  return fetch(`${baseURL}/ai/chat/history`, {
    method: 'GET',
    headers: {
      [TOKEN_KEY]: token || '',
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
}

/**
 * 请求后端停止当前会话的流式生成（可选：当客户端需要显式通知服务器停止）
 * @param {string} sessionId
 * @returns {Promise}
 */
export function stopChat(body = {}) {
  // 使用相同的 /ai/chat 接口传递 stop 标志或其他请求体，后端可根据 stop=true 来判断为中止命令
  const baseURL = getBaseURL();
  const token = getToken();
  const reqBody = { ...body, stop: true };
  return fetch(`${baseURL}/ai/chat`, {
    method: 'POST',
    headers: {
      [TOKEN_KEY]: token || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 返回可能是流式响应或普通 JSON；这里尝试解析为 JSON（后端应返回确认）
    return response.json().catch(() => ({}));
  });
}

export default {
  createChatStream,
  getChatHistory,
  stopChat,
};
