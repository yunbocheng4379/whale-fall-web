import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useState, useRef, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import { baseURL } from '@/utils/request';
import { getToken, TOKEN_KEY } from '@/utils/tokenUtil';
import './index.less';

const { TextArea } = Input;

const AiAsk = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '您好！我是AI助手，有什么我可以帮您的吗？',
      timestamp: new Date()
    }
  ]);

  // 用于存储当前AI消息的ID
  const currentAiMessageId = useRef(null);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 清理EventSource连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log('清理EventSource连接');
        eventSourceRef.current.close();
      }
    };
  }, []);

  const createEventSourceWithAuth = (url) => {
    // 创建带有认证头的EventSource
    const token = getToken();
    if (!token) {
      message.error('用户未登录或登录已过期，请重新登录');
      setLoading(false);
      return null;
    }

    // 构造带认证参数的URL
    const urlWithAuth = new URL(url);
    urlWithAuth.searchParams.append(TOKEN_KEY, token);

    console.log('使用认证信息连接到EventSource:', urlWithAuth.toString());

    return new EventSource(urlWithAuth.toString());
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // 创建AI回复消息占位
      const aiMessageId = Date.now() + 1;
      currentAiMessageId.current = aiMessageId;

      const aiMessagePlaceholder = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessagePlaceholder]);

      // 使用EventSource处理流式响应
      // 构建完整的API URL
      const API_URL = `${baseURL}/ai/chat/stream/${encodeURIComponent(inputValue)}`;
      console.log('准备连接到EventSource:', API_URL);

      eventSourceRef.current = createEventSourceWithAuth(API_URL);

      if (!eventSourceRef.current) {
        return;
      }

      let accumulatedContent = '';

      eventSourceRef.current.onopen = (event) => {
        console.log('EventSource连接已打开:', event);
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          console.log('收到SSE消息:', event.data);

          // 直接将收到的数据添加到累积内容中
          // 后端返回的是纯文本片段，不是JSON格式
          accumulatedContent += event.data;

          // 更新AI消息内容
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessageId) {
              return {
                ...msg,
                content: accumulatedContent
              };
            }
            return msg;
          }));
        } catch (parseError) {
          console.error('处理消息数据时出错:', parseError);
          console.log('原始数据:', event.data);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.log('收到结束事件:', error);
        eventSourceRef.current.close();
        setLoading(false);
      };

    } catch (error) {
      console.error('发送消息时出错:', error);
      message.error('发送消息失败');

      // 添加错误消息
      const errorMessage = {
        id: Date.now() + 2,
        type: 'error',
        content: '抱歉，我无法回答您的问题，请稍后重试~',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageContainer title={false} className="ai-chat-container">
      <ProCard className="chat-wrapper">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-item ${msg.type}-message`}>
                <div className="message-content">
                  <div className="avatar">
                    {msg.type === 'ai' ? (
                      <div className="ai-avatar">AI</div>
                    ) : (
                      <div className="user-avatar">我</div>
                    )}
                  </div>
                  <div className="content">
                    <MDEditor.Markdown source={msg.content} />
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <ProCard>
              <div className="input-container">
                <TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onPressEnter={handleKeyPress}
                  placeholder="请输入您的问题..."
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  disabled={loading}
                  className="chat-textarea"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={loading}
                  disabled={!inputValue.trim()}
                  className="send-button"
                />
              </div>
            </ProCard>
          </div>
        </div>
      </ProCard>
    </PageContainer>
  );
};

export default withAuth(AiAsk);
