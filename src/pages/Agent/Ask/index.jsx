import { withAuth } from '@/components/Auth';
import { PageContainer} from '@ant-design/pro-components';
import { Button, Input, message, Dropdown, Menu, Modal } from 'antd';
import { 
  SendOutlined,
  PlusOutlined,
  PaperClipOutlined,
  PictureOutlined,
  BulbOutlined,
  ShoppingOutlined,
  MoreOutlined,
  RightOutlined,
  EditOutlined,
  SearchOutlined as SearchIcon,
  DatabaseOutlined,
  FolderOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  EllipsisOutlined,
  FlagOutlined,
  DeleteOutlined,
  InboxOutlined,
  StarFilled,
  DownOutlined,
  LeftOutlined,
  RightOutlined as RightArrowOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createChatStream } from '@/api/AiAskApi';
import ModelApi from '@/api/ModelApi';
import styles from './index.less';
import SendButton from '@/components/SendButton';

// 生成唯一ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const extractStreamText = (chunk) => {
  if (!chunk) return '';
  try {
    if (typeof chunk === 'string') {
      const obj = JSON.parse(chunk);
      if (obj && typeof obj.data === 'string') {
        return obj.data;
      }
      if (obj && typeof obj.d === 'string') {
        return obj.d;
      }
    }
    if (typeof chunk === 'object' && chunk !== null) {
      if (typeof chunk.data === 'string') {
        return chunk.data;
      }
      if (typeof chunk.d === 'string') {
        return chunk.d;
      }
    }
  } catch (e) {
    console.warn('Failed to parse chunk:', chunk, e);
  }
  return '';
};

const AskPage = () => {
  const titleOptions = ['在时刻准备着。', '今天有什么计划?', '您今天什么安排？'];
  const getRandomTitle = () =>
    titleOptions[Math.floor(Math.random() * titleOptions.length)];

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => generateId());
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modelDropdownVisible, setModelDropdownVisible] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState(getRandomTitle);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Translate message content', active: true },
    { id: 2, title: '建表语句风格统一', active: false },
    { id: 3, title: 'Java学习路线图', active: false },
    { id: 4, title: 'MyBatis-Plus 错误分析', active: false },
  ]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const streamControllerRef = useRef(null);
  const accumulatedContentRef = useRef('');
  
  // 判断是否为新聊天（没有消息）
  const isNewChat = messages.length === 0;

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        // 使用非分页接口获取全部模型
        const res = await ModelApi.getAllModels();
        if (res && res.data) {
          const data = res.data.data || res.data;
          const m = data.models || data || [];
          setModels(m);
          if (m.length > 0) {
            setSelectedModelId(m[0].id);
          }
        }
      } catch (e) {
        console.error('获取模型列表失败', e);
      }
    };
    fetchModels();
  }, []);

  // 组件卸载时关闭流式连接
  useEffect(() => {
    return () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.close();
      }
    };
  }, []);

  // 生成新的会话ID
  const generateNewSession = () => {
    setSessionId(generateId());
    setMessages([]);
    setNewChatTitle(getRandomTitle());
    message.success('已开始新会话');
  };

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    // 关闭之前的流式连接（如果有）
    if (streamControllerRef.current) {
      streamControllerRef.current.close();
      streamControllerRef.current = null;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // 添加用户消息
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // 添加AI消息占位符
    const aiMessageId = Date.now() + 1;
    const newAiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    setMessages((prev) => [...prev, newAiMessage]);

    // 创建流式连接
    // 重置累积内容
    accumulatedContentRef.current = '';
    
    streamControllerRef.current = createChatStream(
      userMessage,
      sessionId,
      selectedModelId,
      // onMessage - 每次收到数据块立即调用，实时更新UI
      (chunk) => {
        const piece = extractStreamText(chunk);
        accumulatedContentRef.current += piece;
        
        // 立即更新状态，触发UI重新渲染 - 这是关键！每次数据到达都立即更新
        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === aiMessageId) {
              return {
                ...msg,
                content: accumulatedContentRef.current,
                isStreaming: true,
              };
            }
            return msg;
          });
        });
      },
      // onError
      (error) => {
        console.error('Stream error:', error);
        message.error('请求失败，请稍后重试');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false, content: msg.content || '抱歉，发生了错误，请稍后重试。' }
              : msg
          )
        );
        setIsLoading(false);
      },
      // onComplete
      () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
        setIsLoading(false);
      }
    );
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 下拉菜单项
  const menuItems = [
    {
      key: 'add-file',
      icon: <PaperClipOutlined />,
      label: '添加照片和文件',
    },
    {
      key: 'create-image',
      icon: <PictureOutlined />,
      label: '创建图片',
    },
    {
      key: 'think',
      icon: <BulbOutlined />,
      label: '思考',
    },
    {
      key: 'research',
      icon: <SearchIcon />,
      label: '深度研究',
    },
    {
      key: 'shopping',
      icon: <ShoppingOutlined />,
      label: '智能购物',
    },
    {
      key: 'more',
      icon: <MoreOutlined />,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>更多</span>
          <RightOutlined style={{ fontSize: '12px', color: '#999' }} />
        </span>
      ),
    },
  ];

  const handleMenuClick = (e) => {
    setDropdownVisible(false);
    // 处理菜单项点击
    console.log('Menu item clicked:', e.key);
  };

  // 搜索聊天模糊筛选
  const filteredHistory = useMemo(() => {
    if (!searchKeyword.trim()) return chatHistory;
    const kw = searchKeyword.toLowerCase();
    return chatHistory.filter((chat) => chat.title.toLowerCase().includes(kw));
  }, [chatHistory, searchKeyword]);

  const ellipsisMenuItems = [
    { key: 'archive', icon: <InboxOutlined />, label: '归档' },
    { key: 'report', icon: <FlagOutlined />, label: '报告' },
    { key: 'delete', icon: <DeleteOutlined style={{ color: '#e74c3c' }} />, label: <span style={{ color: '#e74c3c' }}>删除</span>, className: 'delete-item' },
  ];

  const modelMenuItems = (models || []).map((m, idx) => ({
    key: String(m.id),
    label: (
      <div
        style={{
          padding: '10px 16px',
          borderBottom: idx !== (models.length - 1) ? '1px solid #f0f0f0' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.modelName || m.name || `Model ${m.id}`}
        </div>
      </div>
    ),
  }));

  return (
    <PageContainer 
      title={false} 
      breadcrumb={false}
      header={{
        title: false,
        breadcrumb: false,
      }}
    >
      <div className={styles['ai-chat-layout']}>
        {/* 左侧边栏容器 */}
        <div className={`${styles['sidebar-wrapper']} ${sidebarCollapsed ? styles['collapsed'] : ''}`}>
          <div className={`${styles['sidebar']} ${sidebarCollapsed ? styles['collapsed'] : ''}`}>
          <div className={styles['sidebar-header']}>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              className={styles['new-chat-btn']}
              onClick={generateNewSession}
            >
              新聊天
            </Button>
            <Button 
              type="text" 
              icon={<SearchIcon />} 
              className={styles['search-chat-btn']}
              onClick={() => setSearchVisible(true)}
            >
              搜索聊天
            </Button>
          </div>
          
          <div className={styles['sidebar-actions']}>
            <Button 
              type="text" 
              icon={<DatabaseOutlined />} 
              className={styles['action-btn']}
            >
              库
            </Button>
            <Button 
              type="text" 
              icon={<FolderOutlined />} 
              className={styles['action-btn']}
            >
              项目
            </Button>
          </div>

          <div className={styles['chat-history']}>
            <div className={styles['history-title']}>你的聊天</div>
            <div className={styles['history-list']}>
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`${styles['history-item']} ${chat.active ? styles['active'] : ''}`}
                  onClick={() => {
                    setChatHistory(prev => prev.map(c => ({ ...c, active: c.id === chat.id })));
                  }}
                >
                  {chat.title}
                </div>
              ))}
            </div>
          </div>

          </div>
          
          {/* 收缩按钮 */}
          <div
            className={styles['collapse-button']}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <RightArrowOutlined /> : <LeftOutlined />}
          </div>
        </div>

        {/* 主内容区 */}
        <div className={`${styles['main-content']} ${sidebarCollapsed ? styles['expanded'] : ''}`}>
          {/* 顶部导航栏 */}
          <div className={styles['top-bar']}>
            <Dropdown
              overlay={
            <Menu
                  items={modelMenuItems}
                  onClick={(e) => {
                    setSelectedModelId(Number(e.key));
                    setModelDropdownVisible(false);
                  }}
                  className={styles['model-dropdown']}
                  style={{ minWidth: 380, maxWidth: 720, overflowX: 'hidden', whiteSpace: 'normal' }}
                />
              }
              trigger={['click']}
              open={modelDropdownVisible}
              onOpenChange={setModelDropdownVisible}
              placement="bottomLeft"
            >
              <div className={styles['top-bar-left']}>
                <span className={styles['model-name']}>{(models.find(m => m.id === selectedModelId) || {}).modelName || '未选择模型'}</span>
                <DownOutlined className={styles['dropdown-icon']} />
              </div>
            </Dropdown>
            <div className={styles['top-bar-center']}>
              <Button 
                type="primary" 
                icon={<StarFilled />}
                className={styles['plus-btn']}
              >
                鲸落
              </Button>
            </div>
            <div className={styles['top-bar-right']}>
              <Button 
                type="text" 
                icon={<ShareAltOutlined />}
                className={styles['action-icon-btn']}
              >
                分享
              </Button>
              <Button 
                type="text" 
                icon={<UserAddOutlined />}
                className={styles['action-icon-btn']}
              >
                添加人员
              </Button>
              <Dropdown
                overlay={
                  <Menu
                    items={ellipsisMenuItems}
                    className={styles['ellipsis-menu']}
                  />
                }
                trigger={['click']}
                placement="bottomRight"
              >
                <Button 
                  type="text" 
                  icon={<EllipsisOutlined />}
                  className={`${styles['action-icon-btn']} ${styles['ellipsis-btn']}`}
                />
              </Dropdown>
            </div>
          </div>

          {/* 聊天内容区 */}
          <div className={styles['chat-content']}>
            {isNewChat ? (
              // 新聊天状态：居中显示
              <div className={styles['new-chat-container']}>
                <div className={styles['new-chat-title']}>{newChatTitle}</div>
                <div className={styles['new-chat-input-wrapper']}>
                  <div className={styles['new-chat-input-container']}>
                    <Dropdown
                      overlay={
                        <Menu 
                          items={menuItems} 
                          onClick={handleMenuClick}
                          className={styles['dropdown-menu']}
                        />
                      }
                      trigger={['click']}
                      open={dropdownVisible}
                      onOpenChange={setDropdownVisible}
                      placement="topLeft"
                    >
                      <Button 
                        type="text" 
                        icon={<PlusOutlined />} 
                        className={styles['add-button-inline']}
                      />
                    </Dropdown>
                    <Input
                      className={styles['new-chat-input']}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="询问任何问题"
                      disabled={isLoading}
                    />
                    <Button
                      className={styles['new-chat-send-button']}
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isLoading}
                      loading={isLoading}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // 有消息状态：正常聊天界面
              <div className={styles['chat-messages']} ref={chatContainerRef}>
                {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles['message-item']} ${
                    msg.role === 'user' ? styles['user-message'] : ''
                  }`}
                >
                  <div className={styles['message-content']}>
                    <div className={styles.content}>
                      {msg.role === 'user' ? (
                        <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                          {msg.content}
                        </div>
                      ) : (
                        <div className={styles['markdown-content']}>
                          {msg.content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            // 只在没有任何内容时显示打字指示器
                            msg.isStreaming && (
                              <span className={styles['typing-indicator']}>
                                <span></span>
                                <span></span>
                                <span></span>
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* 输入区域 - 仅在有消息时显示底部输入框 */}
            {!isNewChat && (
              <div className={styles['chat-input']}>
                <div className={styles['new-chat-input-container']}>
                  <Dropdown
                    overlay={
                      <Menu 
                        items={menuItems} 
                        onClick={handleMenuClick}
                        className={styles['dropdown-menu']}
                      />
                    }
                    trigger={['click']}
                    open={dropdownVisible}
                    onOpenChange={setDropdownVisible}
                    placement="topLeft"
                  >
                    <Button 
                      type="text" 
                      icon={<PlusOutlined />} 
                      className={styles['add-button-inline']}
                    />
                  </Dropdown>
                  <Input
                    className={styles['chat-input-field']}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="询问任何问题"
                    disabled={isLoading}
                  />
                  <SendButton
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    loading={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 搜索聊天弹窗 */}
      <Modal
        open={searchVisible}
        onCancel={() => setSearchVisible(false)}
        footer={null}
        closable={false}
        className={styles['search-modal']}
        width={720}
        maskClosable
        destroyOnClose
        centered
      >
        <div className={styles['search-modal-content']}>
          <Input
            className={styles['search-modal-input']}
            placeholder="搜索聊天..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
          />
          <div className={styles['search-modal-list']}>
            <div className={styles['search-section-title']}>历史聊天</div>
            {filteredHistory.length === 0 && (
              <div className={styles['search-empty']}>暂无匹配结果</div>
            )}
            {filteredHistory.map((chat) => (
              <div key={chat.id} className={styles['search-item']}>
                <span className={styles['search-item-title']}>{chat.title}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default withAuth(AskPage);

