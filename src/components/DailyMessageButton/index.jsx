import AccountApi from '@/api/AccountApi';
import { getUsername } from '@/utils/tokenUtil';
import { BellOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Empty,
  List,
  Spin,
  Tag,
  Tooltip,
  message,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import './index.less';

const DailyMessageButton = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [numberOfType, setNumberOfType] = useState({
    untreated: 0,
    processed: 0,
  });
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 缓存相关状态
  const [cacheData, setCacheData] = useState({
    messages: [],
    numberOfType: { untreated: 0, processed: 0 },
    timestamp: null,
    isExpired: true,
  });

  // 检查缓存是否过期（30分钟）
  const isCacheExpired = (timestamp) => {
    if (!timestamp) return true;
    const now = Date.now();
    const cacheAge = now - timestamp;
    return cacheAge > 1800000; // 30分钟过期
  };

  // 获取消息列表（带重试机制）
  const getMessages = async (retryCount = 0) => {
    const maxRetries = 2;
    const username = getUsername();
    if (!username) {
      return [];
    }
    try {
      const response = await AccountApi.queryDailyMessages({
        recipientUser: username,
        current: 1,
        size: 10, // 只获取最新的10条消息
      });
      if (response.success) {
        // 根据实际数据格式处理：response.data.list 是数组
        return response.data.list || [];
      } else {
        throw new Error('API返回失败');
      }
    } catch (error) {
      console.error(
        `获取消息列表失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`,
        error,
      );
      if (retryCount < maxRetries) {
        // 等待1秒后重试
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        return getMessages(retryCount + 1);
      }
      throw error;
    }
  };
  // 打开下拉并加载消息（复用此前鼠标悬停的加载逻辑）
  const handleOpenDropdown = async () => {
    // 检查缓存是否有效
    if (!isCacheExpired(cacheData.timestamp)) {
      // 使用缓存数据
      setMessages(cacheData.messages);
      setNumberOfType(cacheData.numberOfType);
      setHasUnreadMessages(cacheData.numberOfType?.untreated > 0);
      setIsDropdownVisible(true);
      return;
    }

    // 缓存过期或不存在，重新请求
    setIsLoading(true);
    try {
      // 并行获取消息列表和状态信息
      const [messagesData, statusData] = await Promise.all([
        getMessages(),
        getMessageStatusInfo(),
      ]);

      // 更新缓存
      const newCacheData = {
        messages: messagesData,
        numberOfType: statusData,
        timestamp: Date.now(),
        isExpired: false,
      };
      setCacheData(newCacheData);

      // 更新状态
      setMessages(messagesData);
      setNumberOfType(statusData);
      setHasUnreadMessages(statusData?.untreated > 0);
      setIsDropdownVisible(true);
    } catch (error) {
      console.error('获取消息数据失败:', error);
      message.error('获取消息失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理切换（点击）
  const handleToggle = async () => {
    if (isDropdownVisible) {
      setIsDropdownVisible(false);
      return;
    }
    await handleOpenDropdown();
  };

  // 获取消息状态信息（带重试机制）
  const getMessageStatusInfo = async (retryCount = 0) => {
    const maxRetries = 2;
    const username = getUsername();
    if (!username) {
      return { untreated: 0, processed: 0 };
    }
    try {
      const { success, data } = await AccountApi.getMessageStatusInfo(username);
      if (success) {
        return data?.data || { untreated: 0, processed: 0 };
      } else {
        throw new Error('API返回失败');
      }
    } catch (error) {
      console.error(
        `获取消息状态失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`,
        error,
      );
      if (retryCount < maxRetries) {
        // 等待1秒后重试
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        return getMessageStatusInfo(retryCount + 1);
      }
      // 最终失败返回默认值，避免抛错影响页面
      return { untreated: 0, processed: 0 };
    }
  };

  // 刷新消息数据（强制刷新，忽略缓存）
  const refreshMessages = async () => {
    setIsLoading(true);
    try {
      // 并行获取消息列表和状态信息
      const [messagesData, statusData] = await Promise.all([
        getMessages(),
        getMessageStatusInfo(),
      ]);

      // 更新缓存
      const newCacheData = {
        messages: messagesData,
        numberOfType: statusData,
        timestamp: Date.now(),
        isExpired: false,
      };
      setCacheData(newCacheData);

      // 更新状态
      setMessages(messagesData);
      setNumberOfType(statusData);
      setHasUnreadMessages(statusData?.untreated > 0);
    } catch (error) {
      console.error('刷新消息数据失败:', error);
      message.error('刷新消息失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化获取消息状态（只获取状态，不获取消息列表）
  const initializeMessageStatus = async () => {
    try {
      const statusData = await getMessageStatusInfo();
      setNumberOfType(statusData);
      setHasUnreadMessages(statusData?.untreated > 0);
    } catch (error) {
      console.error('初始化消息状态失败:', error);
    }
  };

  // 组件挂载时获取消息状态
  useEffect(() => {
    initializeMessageStatus();

    // 设置定时器定期检查消息状态和缓存过期
    const interval = setInterval(() => {
      initializeMessageStatus();

      // 检查缓存是否过期，如果过期则清除
      if (cacheData.timestamp && isCacheExpired(cacheData.timestamp)) {
        setCacheData({
          messages: [],
          numberOfType: { untreated: 0, processed: 0 },
          timestamp: null,
          isExpired: true,
        });
      }
    }, 7200000); // 每2小时检查一次

    return () => clearInterval(interval);
  }, [cacheData.timestamp]);

  // 格式化时间
  const formatTime = (timeString) => {
    // 处理字符串格式的时间 "2025-05-07 18:21:27"
    const date = new Date(timeString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) {
      // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 604800000) {
      // 7天内
      return `${Math.floor(diff / 86400000)}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const rootRef = useRef(null);
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!isDropdownVisible) return;
    const handleDocClick = (e) => {
      const rootEl = rootRef.current;
      const dropEl = dropdownRef.current;
      if (rootEl && rootEl.contains(e.target)) return;
      if (dropEl && dropEl.contains(e.target)) return;
      setIsDropdownVisible(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [isDropdownVisible]);

  return (
    <div
      ref={rootRef}
      className="daily-message-button"
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleToggle();
        }
      }}
    >
      <Tooltip
        title={
          hasUnreadMessages
            ? `消息通知 (${numberOfType.untreated}条待处理)`
            : '消息通知'
        }
        placement="bottom"
      >
        <Badge
          dot={hasUnreadMessages}
          offset={[-4, 0]}
          className={hasUnreadMessages ? 'has-unread' : ''}
        >
          <Button
            type="text"
            loading={isLoading}
            style={{
              padding: 0,
              height: 'auto',
              color: 'inherit',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className={`custom-fullscreen-btn ${hasUnreadMessages ? 'has-unread-messages' : ''}`}
            icon={
              <BellOutlined
                style={{
                  fontSize: 18,
                  color: hasUnreadMessages ? '#ff4d4f' : 'inherit',
                  transition: 'color 0.3s ease',
                }}
              />
            }
          />
        </Badge>
      </Tooltip>

      {/* 下拉消息卡片 */}
      {isDropdownVisible && (
        <div className="message-dropdown">
          <Card
            title={
              <div className="dropdown-header">
                <span>消息通知</span>
                <div className="header-actions">
                  <div className="message-stats">
                    <Tag color="red">待处理 {numberOfType.untreated}</Tag>
                    <Tag color="green">已处理 {numberOfType.processed}</Tag>
                  </div>
                  <Tooltip title="刷新消息">
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={isLoading}
                      onClick={refreshMessages}
                      style={{ marginLeft: 8 }}
                    />
                  </Tooltip>
                </div>
              </div>
            }
            size="small"
            className="message-card"
          >
            {isLoading ? (
              <div className="loading-container">
                <Spin size="small" />
                <span style={{ marginLeft: 8 }}>加载中...</span>
              </div>
            ) : messages.length > 0 ? (
              <List
                dataSource={messages}
                renderItem={(item) => (
                  <List.Item className="message-item" key={item.id}>
                    <div className="message-card-wrapper">
                      {/* 状态指示条 */}
                      <div
                        className={`status-indicator ${item.status ? 'processed' : 'pending'}`}
                      ></div>

                      {/* 消息内容 */}
                      <div className="message-content">
                        {/* 标题和状态 */}
                        <div className="message-header">
                          <div className="message-title" title={item.title}>
                            {item.title}
                          </div>
                          <div className="message-badges">
                            <span
                              className={`status-badge ${item.status ? 'completed' : 'pending'}`}
                            >
                              {item.status ? '已处理' : '待处理'}
                            </span>
                          </div>
                        </div>

                        {/* 内容 */}
                        <div className="message-body">
                          <p className="message-text" title={item.content}>
                            {item.content}
                          </p>
                        </div>

                        {/* 底部信息 */}
                        <div className="message-footer">
                          <span className="sender-name">{item.notifyUser}</span>
                          <span className="message-time">
                            {formatTime(item.createTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
                className="message-list"
              />
            ) : (
              <Empty
                description="暂无消息"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '20px 0' }}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default DailyMessageButton;
