import {
  createChatStream,
  deleteChatMessage,
  getChatHistory,
  stopChat,
} from '@/api/AiAskApi';
import DocumentApi from '@/api/DocumentApi';
import KnowledgeApi from '@/api/KnowledgeApi';
import ModelApi from '@/api/ModelApi';
import { withAuth } from '@/components/Auth';
import SendButton from '@/components/SendButton';
import {
  BulbOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  DislikeFilled,
  DislikeOutlined,
  DownOutlined,
  EditOutlined,
  FileTextOutlined,
  FlagOutlined,
  FolderOutlined,
  InboxOutlined,
  LeftOutlined,
  LikeFilled,
  LikeOutlined,
  MessageOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PictureOutlined,
  ReloadOutlined,
  RightOutlined as RightArrowOutlined,
  RightOutlined,
  SearchOutlined as SearchIcon,
  ShoppingOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Dropdown,
  Empty,
  Input,
  message,
  Modal,
  Popconfirm,
  Spin,
  Tabs,
  Tooltip,
  Upload,
} from 'antd';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './index.less';

const { TextArea } = Input;

// 生成唯一ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 解析后端返回的流式 chunk，可能是 {data: "..."} 也可能是 {followUps: [...]}
const parseStreamChunk = (chunk) => {
  if (!chunk) return { content: '', followUps: null };
  try {
    // 如果是字符串，尝试解析为 JSON
    if (typeof chunk === 'string') {
      const obj = JSON.parse(chunk);
      if (obj) {
        if (Array.isArray(obj.followUps)) {
          return { content: '', followUps: obj.followUps };
        }
        if (typeof obj.data === 'string') {
          return { content: obj.data, followUps: null };
        }
        if (typeof obj.d === 'string') {
          return { content: obj.d, followUps: null };
        }
      }
    }

    // 已经是对象
    if (typeof chunk === 'object' && chunk !== null) {
      if (Array.isArray(chunk.followUps)) {
        return { content: '', followUps: chunk.followUps };
      }
      if (typeof chunk.data === 'string') {
        return { content: chunk.data, followUps: null };
      }
      if (typeof chunk.d === 'string') {
        return { content: chunk.d, followUps: null };
      }
    }
  } catch (e) {
    console.warn('Failed to parse chunk:', chunk, e);
  }
  return { content: '', followUps: null };
};

const AskPage = () => {
  const titleOptions = [
    '在时刻准备着。',
    '今天有什么计划?',
    '您今天什么安排？',
  ];
  const getRandomTitle = () =>
    titleOptions[Math.floor(Math.random() * titleOptions.length)];

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState(''); // 输入框内容（受控组件，确保发送后清空且不回显）
  const [hasInputValue, setHasInputValue] = useState(false);
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
  const [chatHistory, setChatHistory] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true); // 初始加载历史记录的状态
  const currentAiMessageIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const historyListContainerRef = useRef(null); // 左侧历史列表容器
  const streamControllerRef = useRef(null);
  const accumulatedContentRef = useRef('');
  const inputRef = useRef(null);
  const chatInputRef = useRef(null);
  const leftActionsRef = useRef(null);
  const addFileWrapperRef = useRef(null);
  const isLoadingRef = useRef(isLoading); // 保存最新的 isLoading 状态
  const isStreamingRef = useRef(isStreaming); // 保存最新的 isStreaming 状态
  // 由于 handleSend 使用 useCallback([]) 以保持稳定引用，这里用 ref 同步关键 state，避免闭包拿到旧值
  const sessionIdRef = useRef(sessionId);
  const selectedModelIdRef = useRef(selectedModelId);
  const viewingKnowledgeIdRef = useRef(viewingKnowledgeId);
  const selectedKnowledgeDocIdsRef = useRef(selectedKnowledgeDocIds);
  const selectedLocalTempFileIdsRef = useRef(selectedLocalTempFileIds);
  const modalSelectedByKbRef = useRef(modalSelectedByKb);
  const [computedGap, setComputedGap] = useState(null);

  // 计算 left-actions 与 add-file wrapper 两处 gap 值，优先取较小的可用值
  useEffect(() => {
    const calc = () => {
      try {
        const leftEl = leftActionsRef.current;
        const wrapEl = addFileWrapperRef.current;
        const leftGap = leftEl ? parseFloat(getComputedStyle(leftEl).gap) : 0;
        const wrapGap = wrapEl ? parseFloat(getComputedStyle(wrapEl).gap) : 0;
        const candidates = [leftGap || 0, wrapGap || 0].filter((v) => v > 0);
        if (candidates.length > 0) {
          setComputedGap(Math.min(...candidates));
        } else {
          setComputedGap(4);
        }
      } catch (err) {
        setComputedGap(4);
      }
    };

    // calculate after paint
    setTimeout(calc, 0);
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // 同步 isLoading 状态到 ref，供回调函数使用
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // 同步 isStreaming 状态到 ref，供回调函数使用
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // 同步关键 state 到 ref，供稳定回调使用
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  useEffect(() => {
    selectedModelIdRef.current = selectedModelId;
  }, [selectedModelId]);
  useEffect(() => {
    viewingKnowledgeIdRef.current = viewingKnowledgeId;
  }, [viewingKnowledgeId]);
  useEffect(() => {
    selectedKnowledgeDocIdsRef.current = selectedKnowledgeDocIds;
  }, [selectedKnowledgeDocIds]);
  useEffect(() => {
    selectedLocalTempFileIdsRef.current = selectedLocalTempFileIds;
  }, [selectedLocalTempFileIds]);
  useEffect(() => {
    modalSelectedByKbRef.current = modalSelectedByKb;
  }, [modalSelectedByKb]);

  // 选择/上传文件相关状态
  const [selectDocModalVisible, setSelectDocModalVisible] = useState(false);
  const [selectedKnowledgeDocIds, setSelectedKnowledgeDocIds] = useState([]);
  const [selectedLocalTempFileIds, setSelectedLocalTempFileIds] = useState([]);
  // modal selected documents stored per knowledge base id to allow cross-KB selection
  const [modalSelectedByKb, setModalSelectedByKb] = useState({});
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [knowledgeDocsLoading, setKnowledgeDocsLoading] = useState(false);
  const [viewingKnowledgeId, setViewingKnowledgeId] = useState(null); // viewing state inside modal: null => show all knowledge
  const [docTabKey, setDocTabKey] = useState('knowledge');
  const [modalSearchKeyword, setModalSearchKeyword] = useState('');
  const { Search } = Input;

  // 本地上传相关状态
  const [uploadList, setUploadList] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  // 动态统计：当前 modal 内外合并的已选择数量（用于 footer 显示）
  // 优化：使用 useMemo 避免每次渲染都重新计算
  const combinedKnowledgeCount = useMemo(() => {
    try {
      const s = new Set();
      (selectedKnowledgeDocIds || []).forEach((id) => s.add(id));
      // 统计所有知识库 modal 内的选择（返回到 KB 列表时也应显示这些选择）
      Object.values(modalSelectedByKb || {}).forEach((arr) =>
        (arr || []).forEach((id) => s.add(id)),
      );
      return s.size;
    } catch (e) {
      // fallback: sum sizes (may double-count)
      const modalTotal = Object.values(modalSelectedByKb || {}).reduce(
        (acc, arr) => acc + ((arr || []).length || 0),
        0,
      );
      return (selectedKnowledgeDocIds || []).length + modalTotal;
    }
  }, [selectedKnowledgeDocIds, modalSelectedByKb]);
  const combinedLocalCount = (selectedLocalTempFileIds || []).length;

  // 本地上传相关函数
  const refreshUploadingCount = (list) => {
    const c = list.filter((i) => i.status === 'uploading').length;
    setUploadingCount(c);
  };

  const updateItem = (uid, patch) => {
    setUploadList((prev) => {
      const next = prev.map((p) => (p.uid === uid ? { ...p, ...patch } : p));
      refreshUploadingCount(next);
      return next;
    });
  };

  // animate progress from current value to target over duration (ms)
  const animateProgress = (uid, from, to, duration = 300, callback) => {
    const start = Date.now();
    const step = () => {
      const now = Date.now();
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (to - from) * t);
      updateItem(uid, { progress: value });
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        if (callback) callback();
      }
    };
    requestAnimationFrame(step);
  };

  // 固定展示的一些示例问题（新聊天时显示）
  const sampleQuestions = [
    '写一份亮眼的季度工作总结',
    '分享一些冬季主题的小手工创意',
    '生成独一无二的新年贺图',
    '为什么一首歌的高潮部分叫做副歌？',
    '有哪些特别下饭的情景喜剧？',
  ];

  // 点击示例问题后直接调用后端问答接口并展示返回内容（与 handleSend 类似的流式逻辑）
  const handleQuickQuestion = (question) => {
    if (isLoading) return;

    // 关闭之前的流（如果有）
    if (streamControllerRef.current) {
      streamControllerRef.current.close();
      streamControllerRef.current = null;
    }

    setIsLoading(true);
    // 清空输入框（受控组件方式，确保发送后清空且不会回显）
    setInputValue('');
    setHasInputValue(false);

    const userMessage = question;
    const activeSessionId = sessionIdRef.current;
    const activeSelectedModelId = selectedModelIdRef.current;
    const activeViewingKnowledgeId = viewingKnowledgeIdRef.current;
    const activeSelectedKnowledgeDocIds =
      selectedKnowledgeDocIdsRef.current || [];
    const activeSelectedLocalTempFileIds =
      selectedLocalTempFileIdsRef.current || [];
    const activeModalSelectedByKb = modalSelectedByKbRef.current || {};
    // 使用临时ID（流式完成后会用真实ID替换）
    const tempUserId = `temp-${Date.now()}`;
    const newUserMessage = {
      id: tempUserId,
      role: 'user',
      content: userMessage,
      tempId: tempUserId, // 保存临时ID用于后续替换
    };
    // 使用函数式更新，并在更新前检查是否已存在相同内容的用户消息
    setMessages((prev) => {
      // 检查是否已存在相同内容的用户消息（防止重复添加）
      const exists = prev.some(
        (m) => m.role === 'user' && m.content === userMessage && !m.tempId,
      );
      if (exists) {
        return prev;
      }
      return [...prev, newUserMessage];
    });
    // 确保视图跳到用户消息（下一帧让 DOM 更新后再定位）
    requestAnimationFrame(() => {
      scrollToBottomImmediate();
    });
    const tempAiId = `temp-ai-${Date.now()}`;
    const aiMessageId = tempAiId;
    // 标记当前正在流式的 AI 消息并开启流式状态
    currentAiMessageIdRef.current = aiMessageId;
    currentAiMessageIdRef.currentTempId = tempAiId; // 保存临时ID
    setIsStreaming(true);
    const newAiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      tempId: tempAiId, // 保存临时ID用于后续替换
    };
    // 使用函数式更新，并在更新前检查是否已存在 AI 消息占位符
    setMessages((prev) => {
      // 检查是否已存在相同ID的AI消息（防止重复添加）
      const exists = prev.some((m) => m.id === aiMessageId);
      if (exists) {
        return prev;
      }
      return [...prev, newAiMessage];
    });
    // AI 占位符加入后也确保定位到底部以展示用户消息与占位符
    requestAnimationFrame(() => {
      scrollToBottomImmediate();
    });

    accumulatedContentRef.current = '';
    // 计算本次请求应使用的知识库 ID 与 文档列表
    let effectiveKnowledgeBaseId = activeViewingKnowledgeId || null;
    // 合并已确认的 selectedKnowledgeDocIds 与 modal 中当前 KB 的选择
    let effectiveSelectedKnowledgeIds = Array.from(
      activeSelectedKnowledgeDocIds || [],
    );
    if (
      activeViewingKnowledgeId &&
      activeModalSelectedByKb &&
      activeModalSelectedByKb[activeViewingKnowledgeId]
    ) {
      effectiveSelectedKnowledgeIds = Array.from(
        new Set([
          ...effectiveSelectedKnowledgeIds,
          ...(activeModalSelectedByKb[activeViewingKnowledgeId] || []),
        ]),
      );
    } else {
      // 当未在某个 KB 内（viewingKnowledgeId 为 null）时，如果 modalSelectedByKb 只有一个 KB 有选择，则使用该 KB 的选择
      const kbEntries = Object.entries(activeModalSelectedByKb || {}).filter(
        ([k, arr]) => arr && arr.length > 0,
      );
      if (kbEntries.length === 1) {
        effectiveKnowledgeBaseId = Number(kbEntries[0][0]);
        effectiveSelectedKnowledgeIds = Array.from(
          new Set([
            ...effectiveSelectedKnowledgeIds,
            ...(kbEntries[0][1] || []),
          ]),
        );
      }
    }

    const docParams = {
      selectedKnowledgeDocIds: effectiveSelectedKnowledgeIds,
      selectedLocalTempFileIds: activeSelectedLocalTempFileIds || [],
    };

    const knowledgeBaseIdForRequest = effectiveKnowledgeBaseId || null;
    streamControllerRef.current = createChatStream(
      userMessage,
      activeSessionId,
      activeSelectedModelId,
      knowledgeBaseIdForRequest,
      docParams,
      (chunk) => {
        const parsed = parseStreamChunk(chunk);
        if (parsed.followUps && parsed.followUps.length > 0) {
          // attach followUps to the current AI message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, followUps: parsed.followUps }
                : msg,
            ),
          );
          return;
        }
        const piece = parsed.content || '';
        accumulatedContentRef.current += piece;

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === aiMessageId) {
              return {
                ...msg,
                content: accumulatedContentRef.current,
                isStreaming: true,
              };
            }
            return msg;
          }),
        );
      },
      (error) => {
        console.error('Stream error:', error);
        message.error('请求失败，请稍后重试');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  isStreaming: false,
                  content: msg.content || '抱歉，发生了错误，请稍后重试。',
                }
              : msg,
          ),
        );
        setIsLoading(false);
        setIsStreaming(false);
        currentAiMessageIdRef.current = null;
        currentAiMessageIdRef.currentTempId = null;
      },
      () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg,
          ),
        );
        setIsLoading(false);
        setIsStreaming(false);
        const tempIdForReplace =
          currentAiMessageIdRef.currentTempId || aiMessageId;
        currentAiMessageIdRef.current = null;
        currentAiMessageIdRef.currentTempId = null;

        // 刷新历史记录并用真实ID替换临时ID（带重试机制）
        const refreshChatHistory = async (retryCount = 0) => {
          try {
            const res = await getChatHistory();
            if (res && res.data) {
              // 解析返回的数据：支持 { data: { list: [...] } } 或直接返回数组
              const payload = res.data.data || res.data;
              const historyList = (payload && payload.list) || payload || [];

              // 使用最新的 sessionId（从 ref 中获取，避免闭包问题）
              const currentSessionId = sessionIdRef.current;

              // 检查当前会话是否已存在于历史列表中（如果不存在，说明异步保存还未完成，重试）
              const currentSessionExists = historyList.some(
                (item) => item.sessionId === currentSessionId,
              );

              // 如果会话不存在且重试次数未超，则延迟重试
              if (!currentSessionExists && retryCount < 3) {
                setTimeout(() => refreshChatHistory(retryCount + 1), 300);
                return;
              }

              // 转换后端数据为前端需要的格式（包含 raw 字段供切换会话使用）
              const formattedHistory = historyList.map((item) => ({
                id: item.sessionId,
                title:
                  item.title ||
                  (item.chatHistoryList && item.chatHistoryList.length > 0
                    ? (
                        item.chatHistoryList[item.chatHistoryList.length - 1]
                          .userMessage || ''
                      ).substring(0, 8)
                    : '新对话'),
                active: item.sessionId === currentSessionId, // 使用最新的 sessionId
                sessionId: item.sessionId,
                userMessage: item.userMessage,
                aiResponse: item.aiResponse,
                createTime: item.createTime,
                // 保存原始数据用于切换会话时加载完整消息
                raw: item,
              }));

              setChatHistory(formattedHistory);

              // 刷新后滚动定位：右侧聊天区域滚动到底部
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  scrollToBottomImmediate();
                });
              });

              // 左侧历史列表滚动到激活的会话项
              requestAnimationFrame(() => {
                const container = historyListContainerRef.current;
                if (!container) return;
                const activeItem = container.querySelector(
                  `.${styles['active']}`,
                );
                if (activeItem) {
                  activeItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                }
              });

              // 用真实ID替换临时ID - 找到当前会话的最新消息记录
              const currentSessionHistory = historyList.find(
                (item) => item.sessionId === currentSessionId,
              );
              if (currentSessionHistory) {
                // 直接更新消息的ID，不做复杂的去重逻辑
                const userOriginalId = `user-${currentSessionHistory.id}`;
                const aiOriginalId = `assistant-${currentSessionHistory.id}`;

                setMessages((prev) => {
                  let hasUpdates = false;
                  const newMessages = prev.map((msg) => {
                    if (msg.tempId) {
                      hasUpdates = true;
                      if (msg.role === 'user') {
                        return {
                          ...msg,
                          id: userOriginalId,
                          tempId: undefined,
                        };
                      }
                      if (msg.role === 'assistant') {
                        return { ...msg, id: aiOriginalId, tempId: undefined };
                      }
                    }
                    return msg;
                  });
                  // 如果没有临时消息需要更新，直接返回原数组
                  return hasUpdates ? newMessages : prev;
                });
              }
            }
          } catch (e) {
            console.error('刷新聊天历史记录失败', e);
          }
        };

        refreshChatHistory();
      },
    );
  };

  // 判断是否为新聊天（没有消息）
  const isNewChat = useMemo(() => messages.length === 0, [messages]);

  // 监听输入框内容变化（控制发送按钮状态，同时更新受控组件的值）
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setHasInputValue(value.trim().length > 0);
  };

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e) => {
      // Enter 发送；Shift + Enter 换行
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      // Shift + Enter 允许默认行为（换行）
    },
    [handleSend],
  );

  // 直接跳到底部（无动画），用于展示历史时定位到最后一条或发送新消息后定位
  const scrollToBottomImmediate = () => {
    requestAnimationFrame(() => {
      const container = chatContainerRef.current;
      if (!container) return;
      try {
        container.style.scrollBehavior = 'auto';
      } catch (e) {}
      container.scrollTop = container.scrollHeight;
    });
  };

  // 初始化输入框的高度（受控组件模式下，inputValue 初始值为空字符串，无需额外清空）
  // 优化：移除 setTimeout 和 setCursorToStart，避免初始化时的性能开销
  useEffect(() => {
    const getDom = (ref) => {
      if (!ref) return null;
      // AntD TextArea instance exposes resizableTextArea.textArea
      if (ref.resizableTextArea && ref.resizableTextArea.textArea)
        return ref.resizableTextArea.textArea;
      if (ref.textArea) return ref.textArea;
      // raw DOM node
      if (ref instanceof HTMLElement) return ref;
      return null;
    };
    const el = getDom(inputRef.current);
    if (el) {
      // 设置初始固定高度，避免抖动
      try {
        el.style.height = '24px';
      } catch (err) {}
    }
  }, []);

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
            // 优先选择 defaultModel 为 true 的模型，如果没有则选择第一个
            const defaultModel = m.find((model) => model.defaultModel);
            setSelectedModelId(defaultModel ? defaultModel.id : m[0].id);
          }
        }
      } catch (e) {
        console.error('获取模型列表失败', e);
      }
    };
    fetchModels();
  }, []);

  // 初始化时获取知识库列表
  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  // 获取聊天历史记录
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await getChatHistory();
        if (res && res.data) {
          const payload = res.data.data || res.data;
          // 支持后端返回 { data: { list: [ ... ] } } 或直接返回 list
          const sessions = (payload && payload.list) || payload || [];

          // formattedHistory 用于左侧会话列表，只展示 sessionId 与 title
          const formattedHistory = sessions.map((item, index) => ({
            id: item.sessionId,
            title:
              item.title ||
              (item.chatHistoryList && item.chatHistoryList.length > 0
                ? (
                    item.chatHistoryList[item.chatHistoryList.length - 1]
                      .userMessage || ''
                  ).substring(0, 8)
                : '新对话'),
            active: index === 0,
            sessionId: item.sessionId,
            // keep original payload for potential usage
            raw: item,
          }));

          setChatHistory(formattedHistory);

          // 默认选中第一个会话并将其 chatHistoryList 转为 messages 显示（按 createTime 升序）
          if (sessions.length > 0) {
            const first = sessions[0];
            setSessionId(first.sessionId);
            const history = Array.isArray(first.chatHistoryList)
              ? first.chatHistoryList.slice()
              : [];
            // 按 createTime 升序（从早到晚）
            history.sort((a, b) => {
              const ta = a.createTime ? new Date(a.createTime).getTime() : 0;
              const tb = b.createTime ? new Date(b.createTime).getTime() : 0;
              return ta - tb;
            });
            // 构建 messages：按照时间顺序，每条 history 转成 user then assistant
            // 使用统一的消息 ID 格式：用户消息为 user-{id}，AI 消息为 assistant-{id}
            const msgs = [];
            history.forEach((h, idx) => {
              if (h.userMessage !== undefined && h.userMessage !== null) {
                msgs.push({
                  id: `user-${h.id}`, // 统一使用 user- 前缀
                  role: 'user',
                  content: h.userMessage,
                  timestamp: h.createTime,
                });
              }
              if (h.aiResponse !== undefined && h.aiResponse !== null) {
                msgs.push({
                  id: `assistant-${h.id}`, // 统一使用 assistant- 前缀
                  role: 'assistant',
                  content: h.aiResponse,
                  timestamp: h.createTime,
                  // 支持历史记录中的 questionList 作为推荐问题
                  questionList:
                    h.questionList && Array.isArray(h.questionList)
                      ? h.questionList
                      : null,
                });
              }
            });
            // 直接设置 messages（按时间顺序，从上到下展示）
            setMessages(msgs);
            // 延迟滚动到底部，确保 DOM 已完成渲染
            requestAnimationFrame(() => {
              scrollToBottomImmediate();
            });
            setNewChatTitle(formattedHistory[0].title || '新对话');
          }
        }
      } catch (e) {
        console.error('获取聊天历史记录失败', e);
        // 如果获取失败，设置为空数组
        setChatHistory([]);
      } finally {
        // 无论成功或失败，都关闭加载状态
        setIsHistoryLoading(false);
      }
    };

    fetchChatHistory();
  }, []);

  // 获取知识库列表（供选择）
  const fetchKnowledgeList = async () => {
    try {
      const res = await KnowledgeApi.getKnowledgeList({});
      if (res && res.data) {
        const data = res.data.data || res.data;
        const list = data.knowledgeList || data || [];
        setKnowledgeList(list);
      }
    } catch (e) {
      console.error('获取知识库列表失败', e);
    }
  };

  // 根据知识库ID获取对应文档列表（用于弹窗选择）
  const fetchDocsByKnowledge = async (kId) => {
    if (!kId) return;
    setKnowledgeDocsLoading(true);
    try {
      const res = await DocumentApi.getDocumentsByKnowledgeId({
        knowledgeBaseId: kId,
      });
      if (res && res.data) {
        const data = res.data.data || res.data;
        const docs = data.documents || data.docs || data || [];
        setKnowledgeDocs(docs);
      }
    } catch (e) {
      console.error('获取知识库文档失败', e);
    } finally {
      setKnowledgeDocsLoading(false);
    }
  };

  // 处理知识库切换逻辑
  const handleKnowledgeSwitch = (kbId) => {
    // 检查是否有其他知识库的选择
    const hasOtherKbSelections = Object.keys(modalSelectedByKb).some(
      (kb) =>
        kb !== kbId.toString() &&
        modalSelectedByKb[kb] &&
        modalSelectedByKb[kb].length > 0,
    );

    if (hasOtherKbSelections) {
      // 弹出确认对话框
      Modal.confirm({
        title: '切换知识库',
        content:
          '您已从其他知识库中选择文档，切换到新知识库将清除这些选择。是否继续？',
        okText: '继续',
        cancelText: '取消',
        onOk() {
          // 清空之前的选择并进入新知识库
          setModalSelectedByKb({});
          setViewingKnowledgeId(kbId);
          fetchDocsByKnowledge(kbId);
        },
        onCancel() {
          // 不做任何操作，保持在当前状态
        },
      });
    } else {
      // 没有其他知识库的选择，直接进入
      setViewingKnowledgeId(kbId);
      fetchDocsByKnowledge(kbId);
    }
  };

  // 获取当前弹窗显示的过滤后文档列表（复用）
  const getFilteredDocs = () => {
    const key = (modalSearchKeyword || '').trim().toLowerCase();
    return key
      ? (knowledgeDocs || []).filter((d) =>
          (d.title || d.fileName || '').toLowerCase().includes(key),
        )
      : knowledgeDocs || [];
  };

  // 切换 modal 中的文档选中状态（按知识库分组）
  const toggleModalSelectDoc = (docId) => {
    const kbId = viewingKnowledgeId;
    if (!kbId) return;
    setModalSelectedByKb((prev) => {
      const next = { ...(prev || {}) };
      const list = new Set(next[kbId] || []);
      if (list.has(docId)) {
        list.delete(docId);
      } else {
        list.add(docId);
      }
      next[kbId] = Array.from(list);
      return next;
    });
  };

  // 确认在知识库 tab 中选择的文档，合并到主选择集合并更新展示列表
  const handleConfirmKnowledgeSelection = () => {
    // 只处理当前查看的知识库的选择
    if (viewingKnowledgeId && modalSelectedByKb[viewingKnowledgeId]) {
      const currentModalSelected = modalSelectedByKb[viewingKnowledgeId] || [];
      if (currentModalSelected.length > 0) {
        setSelectedKnowledgeDocIds((prev) => {
          const s = new Set(prev || []);
          currentModalSelected.forEach((id) => s.add(id));
          return Array.from(s);
        });
      }
    }
    // Clear modal-only selections after confirming
    setModalSelectedByKb({});
    setSelectDocModalVisible(false);
  };

  // 本地上传成功后回调（将返回的 tempFileId 记录到选中集合并更新展示）
  const onLocalUploadSuccess = (tempFileId, fileTitle) => {
    if (!tempFileId) return;
    setSelectedLocalTempFileIds((prev) =>
      prev.includes(tempFileId) ? prev : [...prev, tempFileId],
    );
  };

  // 从已选列表中移除某个文档（只影响选择，不删除服务器存储）
  const removeSelectedDoc = (item) => {
    // display list removed; keep selection ids in sync
    if (item.source === 'knowledge') {
      setSelectedKnowledgeDocIds((prev) => {
        return prev.filter((id) => id !== item.id);
      });
    } else {
      // when removing from the AI-selected list, also remove from uploadList (and backend) by delegating to handleRemoveLocalUpload
      // item.id might be tempFileId or uid
      handleRemoveLocalUpload(item.id);
    }
  };

  // 本地上传验证函数
  const beforeUpload = (file) => {
    const isAllowed =
      [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type) ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.doc') ||
      file.name.endsWith('.docx');
    if (!isAllowed) {
      message.error('仅支持 PDF/Word 文件');
      return Upload.LIST_IGNORE;
    }
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('文件大小不能超过100MB');
      return Upload.LIST_IGNORE;
    }
    // Prevent uploading same file twice in current upload list
    const existsInQueue = uploadList.some((u) => u.title === file.name);
    if (existsInQueue) {
      message.warning(`${file.name} 已在上传列表中，请不要重复添加`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  // 本地上传处理函数
  const handleLocalCustomRequest = (options) => {
    const { file, onProgress, onSuccess, onError } = options;
    const form = new FormData();
    form.append('file', file);
    form.append('title', file.name || file.uid);
    // mark as template/local upload
    form.append('isTemplate', 'true');

    // Ensure uploadList contains this file entry immediately so progress updates render
    setUploadList((prev) => {
      const exists = prev.find((p) => p.uid === file.uid);
      if (exists) return prev;
      return [
        ...prev,
        {
          uid: file.uid,
          title: file.name,
          publishTime: new Date().toISOString(),
          status: 'uploading',
          progress: 1,
          file: file,
        },
      ];
    });

    // 前端进度控制：从1%缓慢加载到99%，如果后端先完成则直接跳转到100%
    let currentProgress = 1;
    let backendDone = false;
    let backendSuccess = null;
    let simStopped = false;
    const simDuration = 30000; // 30秒内达到99%
    const simStart = Date.now();

    const updateProgress = (progress) => {
      currentProgress = progress;
      onProgress && onProgress({ percent: progress });
      // 更新uploadList中的进度
      setUploadList((prev) =>
        prev.map((item) =>
          item.uid === file.uid ? { ...item, progress } : item,
        ),
      );
    };

    const simTick = () => {
      if (simStopped) return;

      const elapsed = Date.now() - simStart;
      const ratio = Math.min(1, elapsed / simDuration);
      const targetProgress = 1 + Math.floor(ratio * 98); // 从1%到99%

      if (targetProgress > currentProgress) {
        updateProgress(targetProgress);
      }

      // 如果达到99%且后端还没完成，就停止模拟，在99%等待
      if (targetProgress >= 99) {
        if (!backendDone) {
          updateProgress(99);
          return; // 停止模拟，等待后端
        } else {
          // 后端已完成，从当前进度缓慢加载到100%
          animateProgress(file.uid, currentProgress, 100, 500, () => {
            updateProgress(100);
          });
          return;
        }
      }

      // 如果后端已完成，从当前进度缓慢加载到100%
      if (backendDone) {
        simStopped = true;
        animateProgress(file.uid, currentProgress, 100, 500, () => {
          updateProgress(100);
          setTimeout(() => {
            if (backendSuccess) {
              onSuccess && onSuccess();
            } else {
              onError && onError();
            }
          }, 120);
        });
        return;
      }

      setTimeout(simTick, 200);
    };

    // 启动前端进度模拟
    setTimeout(simTick, 200);

    // 调用后端上传API
    DocumentApi.uploadDocument(
      form,
      null,
      (progressEvent) => {
        if (progressEvent && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          // 如果后端进度超过当前进度，更新进度
          if (percent > currentProgress && percent < 100) {
            updateProgress(percent);
          }
        }
      },
      true,
    )
      .then((resp) => {
        backendDone = true;
        backendSuccess = true;
        simStopped = true;

        // 更新tempFileId
        const tempFileId =
          resp && resp.data && resp.data.data
            ? resp.data.data.tempFileId
            : null;
        setUploadList((prev) =>
          prev.map((item) =>
            item.uid === file.uid
              ? { ...item, tempFileId, status: 'success' }
              : item,
          ),
        );

        // 如果前端进度还没到99%，从当前进度缓慢加载到100%
        // 如果已经到99%，保持在99%然后缓慢到100%
        const targetProgress = currentProgress >= 99 ? 99 : currentProgress;
        animateProgress(file.uid, targetProgress, 100, 500, () => {
          updateProgress(100);
          setTimeout(() => {
            // 上传成功后自动添加到已选文档列表
            onLocalUploadSuccess(tempFileId, file.name);
            message.success(`${file.name} 上传成功`);
            onSuccess && onSuccess(resp);
          }, 120);
        });
      })
      .catch((err) => {
        backendDone = true;
        backendSuccess = false;
        simStopped = true;

        // 更新状态为error
        setUploadList((prev) =>
          prev.map((item) =>
            item.uid === file.uid ? { ...item, status: 'error' } : item,
          ),
        );

        // 失败时也从当前进度缓慢加载到100%，然后显示错误
        const targetProgress = currentProgress >= 99 ? 99 : currentProgress;
        animateProgress(file.uid, targetProgress, 100, 500, () => {
          updateProgress(100);
          setTimeout(() => {
            message.error(`${file.name} 上传失败`);
            onError && onError(err);
          }, 120);
        });
      });
  };

  // 删除本地上传的文件
  const handleRemoveLocalUpload = async (uid) => {
    // uid may be an upload uid or a tempFileId; find by either
    const itemToRemove = uploadList.find(
      (item) => item.uid === uid || item.tempFileId === uid,
    );

    // 前端直接从 uploadList 中移除（不再调用后端删除接口）
    setUploadList((prev) => {
      const next = prev.filter(
        (p) => p.uid !== (itemToRemove ? itemToRemove.uid : uid),
      );
      refreshUploadingCount(next);
      return next;
    });

    // 同步从已选集合中移除（兼容 tempFileId / uid）
    setSelectedLocalTempFileIds((prev) => {
      if (!prev || prev.length === 0) return prev || [];
      const removeId = itemToRemove
        ? itemToRemove.tempFileId || itemToRemove.uid
        : uid;
      return prev.filter((id) => id !== removeId);
    });
  };

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
    const nextId = generateId();
    // 立即同步 ref，避免用户立刻发送导致使用旧 sessionId
    sessionIdRef.current = nextId;
    setSessionId(nextId);
    setMessages([]);
    setNewChatTitle(getRandomTitle());
    // 重置所有历史记录为非活跃状态
    setChatHistory((prev) => prev.map((chat) => ({ ...chat, active: false })));
  };

  // 发送消息（非受控组件，直接从 ref 获取值）
  const handleSend = useCallback(() => {
    // 获取原生 textarea 元素
    let textArea = null;
    const el = inputRef.current;

    if (el) {
      // 方法1: 通过 resizableTextArea.textArea (AntD TextArea)
      if (el.resizableTextArea?.textArea) {
        textArea = el.resizableTextArea.textArea;
      }
      // 方法2: 通过 querySelector 直接查找原生 textarea
      else {
        textArea = el.querySelector?.('textarea') || el;
      }
    }

    if (!textArea) {
      return;
    }

    const value = textArea.value?.trim() || '';
    // 严格检查：如果正在加载或没有输入内容，直接返回
    if (!value || isLoadingRef.current) {
      return;
    }
    // 在检查后立即设置，防止重复调用
    isLoadingRef.current = true;

    // 关闭之前的流式连接（如果有）
    if (streamControllerRef.current) {
      streamControllerRef.current.close();
      streamControllerRef.current = null;
    }

    const userMessage = value;
    const activeSessionId = sessionIdRef.current;
    const activeSelectedModelId = selectedModelIdRef.current;
    const activeViewingKnowledgeId = viewingKnowledgeIdRef.current;
    const activeSelectedKnowledgeDocIds =
      selectedKnowledgeDocIdsRef.current || [];
    const activeSelectedLocalTempFileIds =
      selectedLocalTempFileIdsRef.current || [];
    const activeModalSelectedByKb = modalSelectedByKbRef.current || {};
    // 清空输入框（受控组件方式，确保发送后清空且不会回显）
    setInputValue('');
    setHasInputValue(false);
    setIsLoading(true);

    // 添加用户消息 - 使用临时ID（流式完成后会用真实ID替换）
    const tempUserId = `temp-${Date.now()}`;
    const newUserMessage = {
      id: tempUserId,
      role: 'user',
      content: userMessage,
      tempId: tempUserId, // 保存临时ID用于后续替换
    };

    // 使用函数式更新，并在更新前检查是否已存在相同内容的用户消息
    setMessages((prev) => {
      // 检查是否已存在相同内容的用户消息（防止重复添加）
      const exists = prev.some(
        (m) => m.role === 'user' && m.content === userMessage && !m.tempId,
      );
      if (exists) {
        return prev;
      }
      return [...prev, newUserMessage];
    });
    // 在下一帧确保 DOM 已更新后跳到底部以展示用户新消息
    requestAnimationFrame(() => {
      scrollToBottomImmediate();
    });

    // 添加AI消息占位符 - 使用相同的临时ID基础
    const tempAiId = `temp-ai-${Date.now()}`;
    const aiMessageId = tempAiId;
    // 标记当前正在流式的 AI 消息并开启流式状态
    currentAiMessageIdRef.current = aiMessageId;
    currentAiMessageIdRef.currentTempId = tempAiId; // 保存临时ID
    setIsStreaming(true);
    const newAiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      tempId: tempAiId, // 保存临时ID用于后续替换
    };

    // 使用函数式更新，并在更新前检查是否已存在 AI 消息占位符
    setMessages((prev) => {
      // 检查是否已存在相同ID的AI消息（防止重复添加）
      const exists = prev.some((m) => m.id === aiMessageId);
      if (exists) {
        return prev;
      }
      return [...prev, newAiMessage];
    });
    // 加入占位符后也确保滚到底部，显示用户消息与占位符
    requestAnimationFrame(() => {
      scrollToBottomImmediate();
    });

    // 创建流式连接
    // 重置累积内容
    accumulatedContentRef.current = '';

    // 准备文档参数
    // 计算本次请求应使用的知识库 ID 与 文档列表（同上逻辑）
    let effectiveKnowledgeBaseId = activeViewingKnowledgeId || null;
    let effectiveSelectedKnowledgeIds = Array.from(
      activeSelectedKnowledgeDocIds || [],
    );
    if (
      activeViewingKnowledgeId &&
      activeModalSelectedByKb &&
      activeModalSelectedByKb[activeViewingKnowledgeId]
    ) {
      effectiveSelectedKnowledgeIds = Array.from(
        new Set([
          ...effectiveSelectedKnowledgeIds,
          ...(activeModalSelectedByKb[activeViewingKnowledgeId] || []),
        ]),
      );
    } else {
      const kbEntries = Object.entries(activeModalSelectedByKb || {}).filter(
        ([k, arr]) => arr && arr.length > 0,
      );
      if (kbEntries.length === 1) {
        effectiveKnowledgeBaseId = Number(kbEntries[0][0]);
        effectiveSelectedKnowledgeIds = Array.from(
          new Set([
            ...effectiveSelectedKnowledgeIds,
            ...(kbEntries[0][1] || []),
          ]),
        );
      }
    }

    const docParams = {
      selectedKnowledgeDocIds: effectiveSelectedKnowledgeIds,
      selectedLocalTempFileIds: activeSelectedLocalTempFileIds || [],
    };

    const knowledgeBaseIdForRequest = effectiveKnowledgeBaseId || null;
    streamControllerRef.current = createChatStream(
      userMessage,
      activeSessionId,
      activeSelectedModelId, // 传递选中的模型ID
      knowledgeBaseIdForRequest, // 新增 knowledgeBaseId 参数
      docParams, // 传递选择的文档ID
      // onMessage - 每次收到数据块立即调用，实时更新UI
      (chunk) => {
        const parsed = parseStreamChunk(chunk);
        if (parsed.followUps && parsed.followUps.length > 0) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, followUps: parsed.followUps }
                : msg,
            ),
          );
          return;
        }
        const piece = parsed.content || '';
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
              ? {
                  ...msg,
                  isStreaming: false,
                  content: msg.content || '抱歉，发生了错误，请稍后重试。',
                }
              : msg,
          ),
        );
        setIsLoading(false);
        setIsStreaming(false);
        currentAiMessageIdRef.current = null;
      },
      // onComplete
      () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg,
          ),
        );
        setIsLoading(false);
        setIsStreaming(false);
        const tempIdForReplace =
          currentAiMessageIdRef.currentTempId || aiMessageId;
        currentAiMessageIdRef.current = null;
        currentAiMessageIdRef.currentTempId = null;

        // 消息发送完成后刷新历史记录（带重试机制，确保异步保存完成）
        const refreshChatHistory = async (retryCount = 0) => {
          try {
            const res = await getChatHistory();
            if (res && res.data) {
              // 解析返回的数据：支持 { data: { list: [...] } } 或直接返回数组
              const payload = res.data.data || res.data;
              const historyList = (payload && payload.list) || payload || [];

              // 使用最新的 sessionId（从 ref 中获取，避免闭包问题）
              const currentSessionId = sessionIdRef.current;

              // 检查当前会话是否已存在于历史列表中（如果不存在，说明异步保存还未完成，重试）
              const currentSessionExists = historyList.some(
                (item) => item.sessionId === currentSessionId,
              );

              // 如果会话不存在且重试次数未超，则延迟重试
              if (!currentSessionExists && retryCount < 3) {
                setTimeout(() => refreshChatHistory(retryCount + 1), 300);
                return;
              }

              // 转换后端数据为前端需要的格式（包含 raw 字段供切换会话使用）
              const formattedHistory = historyList.map((item) => ({
                id: item.sessionId,
                title:
                  item.title ||
                  (item.chatHistoryList && item.chatHistoryList.length > 0
                    ? (
                        item.chatHistoryList[item.chatHistoryList.length - 1]
                          .userMessage || ''
                      ).substring(0, 8)
                    : '新对话'),
                active: item.sessionId === currentSessionId, // 使用最新的 sessionId
                sessionId: item.sessionId,
                userMessage: item.userMessage,
                aiResponse: item.aiResponse,
                createTime: item.createTime,
                // 保存原始数据用于切换会话时加载完整消息
                raw: item,
              }));

              setChatHistory(formattedHistory);

              // 刷新后滚动定位：右侧聊天区域滚动到底部
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  scrollToBottomImmediate();
                });
              });

              // 左侧历史列表滚动到激活的会话项
              requestAnimationFrame(() => {
                const container = historyListContainerRef.current;
                if (!container) return;
                const activeItem = container.querySelector(
                  `.${styles['active']}`,
                );
                if (activeItem) {
                  activeItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                }
              });

              // 用真实ID替换临时ID - 找到当前会话的最新消息记录
              const currentSessionHistory = historyList.find(
                (item) => item.sessionId === currentSessionId,
              );
              if (currentSessionHistory) {
                // 直接更新消息的ID，不做复杂的去重逻辑
                const userOriginalId = `user-${currentSessionHistory.id}`;
                const aiOriginalId = `assistant-${currentSessionHistory.id}`;

                setMessages((prev) => {
                  let hasUpdates = false;
                  const newMessages = prev.map((msg) => {
                    if (msg.tempId) {
                      hasUpdates = true;
                      if (msg.role === 'user') {
                        return {
                          ...msg,
                          id: userOriginalId,
                          tempId: undefined,
                        };
                      }
                      if (msg.role === 'assistant') {
                        return { ...msg, id: aiOriginalId, tempId: undefined };
                      }
                    }
                    return msg;
                  });
                  // 如果没有临时消息需要更新，直接返回原数组
                  return hasUpdates ? newMessages : prev;
                });
              }
            }
          } catch (e) {
            console.error('刷新聊天历史记录失败', e);
          }
        };

        refreshChatHistory();
      },
    );
  }, []); // handleSend 的依赖数组（空数组，因为内部使用 ref 获取最新值）

  // 发送或暂停切换：如果当前处于流式响应中，点击此按钮将停止当前流；否则发送新消息
  const handleSendOrStop = () => {
    if (isStreaming && streamControllerRef.current) {
      // 停止时仅发送最小信息：sessionId（stop 标志由 stopChat 自动添加）
      const body = { sessionId: sessionIdRef.current };
      (async () => {
        try {
          await stopChat(body);
        } catch (e) {
          console.warn('调用 stopChat 失败，继续本地中止', e);
        }
        // 临时屏蔽 AbortError 的全局未处理拒绝提示，避免浏览器抛出未捕获异常
        const rejectionHandler = (evt) => {
          try {
            if (evt && evt.reason && evt.reason.name === 'AbortError') {
              evt.preventDefault();
            }
          } catch (ex) {}
        };
        window.addEventListener('unhandledrejection', rejectionHandler);
        try {
          streamControllerRef.current.close();
        } catch (e) {
          console.warn('本地关闭流失败', e);
        }
        streamControllerRef.current = null;
        // 在短时间后移除临时处理器
        setTimeout(() => {
          window.removeEventListener('unhandledrejection', rejectionHandler);
        }, 1000);
      })();
      setIsStreaming(false);
      setIsLoading(false);
      const aiId = currentAiMessageIdRef.current;
      if (aiId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? { ...m, isStreaming: false, content: m.content || '（已停止）' }
              : m,
          ),
        );
      }
      currentAiMessageIdRef.current = null;
    } else {
      handleSend();
    }
  };

  // 下拉菜单项
  const menuItems = [
    {
      key: 'add-file',
      icon: <PaperClipOutlined />,
      label: '添加文件',
    },
    {
      type: 'divider',
      key: 'divider-1',
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
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <span>更多</span>
          <RightOutlined style={{ fontSize: '12px', color: '#999' }} />
        </span>
      ),
    },
  ];

  const handleMenuClick = (e) => {
    setDropdownVisible(false);
    // 处理菜单项点击
    if (e.key === 'add-file') {
      // 打开选择文档弹框
      // 默认打开知识库页签
      setDocTabKey('knowledge');
      fetchKnowledgeList(); // 加载知识库列表
      setSelectDocModalVisible(true);
    } else {
      console.log('Menu item clicked:', e.key);
    }
  };

  // 单独用于 paperclip 图标的下拉菜单（显示在图标上方）
  const addFileMenu = [
    {
      key: 'cloud-file',
      icon: <CloudUploadOutlined />,
      label: '选择云盘文件',
    },
    {
      key: 'upload-code',
      icon: <CodeOutlined />,
      label: '上传代码',
    },
    {
      key: 'upload-file-image',
      icon: <FileTextOutlined />,
      label: '上传文件',
    },
    {
      key: 'think',
      icon: <BulbOutlined />,
      label: '深度思考',
    },
  ];

  const handleAddFileMenuClick = (e) => {
    // 关闭任何已有的下拉
    // 根据选择打开对应的面板或弹窗
    if (e.key === 'cloud-file') {
      // 打开知识库选择（云盘视为知识库或远程文件）
      setDocTabKey('knowledge');
      fetchKnowledgeList();
      setSelectDocModalVisible(true);
    } else if (e.key === 'upload-file-image') {
      // 默认展示知识库页签（用户仍可切换到本地上传）
      setDocTabKey('knowledge');
      fetchKnowledgeList();
      setSelectDocModalVisible(true);
    } else if (e.key === 'upload-code') {
      // 默认展示知识库页签（代码上传可从本地或知识库导入）
      setDocTabKey('knowledge');
      fetchKnowledgeList();
      setSelectDocModalVisible(true);
    } else if (e.key === 'think') {
      // existing 'think' behaviour (保留)
      console.log('trigger deep think');
    } else {
      console.log('add-file menu clicked:', e.key);
    }
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
    {
      key: 'delete',
      icon: <DeleteOutlined style={{ color: '#e74c3c' }} />,
      label: <span style={{ color: '#e74c3c' }}>删除</span>,
      className: 'delete-item',
    },
  ];

  const modelMenuItems = (models || []).map((m, idx) => ({
    key: String(m.id),
    label: (
      <div
        style={{
          padding: '10px 16px',
          borderBottom:
            idx !== models.length - 1 ? '1px solid #f0f0f0' : 'none',
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
        <div
          className={`${styles['sidebar-wrapper']} ${sidebarCollapsed ? styles['collapsed'] : ''}`}
        >
          <div
            className={`${styles['sidebar']} ${sidebarCollapsed ? styles['collapsed'] : ''}`}
          >
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
            {/* 历史聊天标题单独作为一个块，位于 sidebar-header 之下 */}
            <div className={styles['history-header']}>
              <div className={styles['history-title-left']}>历史聊天</div>
              <ClockCircleOutlined className={styles['history-title-icon']} />
            </div>

            <div className={styles['chat-history']}>
              <div
                className={styles['history-list']}
                ref={historyListContainerRef}
              >
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`${styles['history-item']} ${chat.active ? styles['active'] : ''}`}
                    onClick={() => {
                      setChatHistory((prev) =>
                        prev.map((c) => ({ ...c, active: c.id === chat.id })),
                      );
                      // 加载选中会话的完整消息列表并展示（按 createTime 升序）
                      // 立即同步 ref，避免切换后立刻发送仍使用旧 sessionId
                      sessionIdRef.current = chat.sessionId;
                      setSessionId(chat.sessionId);
                      const raw = chat.raw || {};
                      const historyList = Array.isArray(raw.chatHistoryList)
                        ? raw.chatHistoryList.slice()
                        : [];
                      historyList.sort((a, b) => {
                        const ta = a.createTime
                          ? new Date(a.createTime).getTime()
                          : 0;
                        const tb = b.createTime
                          ? new Date(b.createTime).getTime()
                          : 0;
                        return ta - tb;
                      });
                      const newMsgs = [];
                      // 直接使用后端返回的原始 id
                      historyList.forEach((h) => {
                        if (
                          h.userMessage !== undefined &&
                          h.userMessage !== null
                        ) {
                          newMsgs.push({
                            id: h.id, // 直接使用后端返回的id
                            role: 'user',
                            content: h.userMessage,
                            timestamp: h.createTime,
                          });
                        }
                        if (
                          h.aiResponse !== undefined &&
                          h.aiResponse !== null
                        ) {
                          newMsgs.push({
                            id: `${h.id}-ai`, // AI消息使用后端id加后缀区分
                            role: 'assistant',
                            content: h.aiResponse,
                            timestamp: h.createTime,
                            // 支持历史记录中的 questionList 作为推荐问题
                            questionList:
                              h.questionList && Array.isArray(h.questionList)
                                ? h.questionList
                                : null,
                          });
                        }
                      });
                      setMessages(newMsgs);
                      setNewChatTitle(chat.title);

                      // 使用双重 requestAnimationFrame 确保 DOM 完全渲染后立即定位到底部（无动画）
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          const container = chatContainerRef.current;
                          if (!container) return;
                          container.style.scrollBehavior = 'auto';
                          container.scrollTop = container.scrollHeight;
                        });
                      });
                    }}
                  >
                    <MessageOutlined
                      style={{
                        marginRight: 8,
                        fontSize: 14,
                        color: chat.active ? '#1890ff' : '#666',
                      }}
                    />
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
        <div
          className={`${styles['main-content']} ${sidebarCollapsed ? styles['expanded'] : ''}`}
        >
          {/* 顶部导航栏 */}
          <div className={styles['top-bar']}>
            <Dropdown
              menu={{
                items: modelMenuItems,
                onClick: (e) => {
                  setSelectedModelId(Number(e.key));
                  setModelDropdownVisible(false);
                },
              }}
              className={styles['model-dropdown']}
              style={{
                minWidth: 380,
                maxWidth: 720,
                overflowX: 'hidden',
                whiteSpace: 'normal',
              }}
              trigger={['click']}
              open={modelDropdownVisible}
              onOpenChange={setModelDropdownVisible}
              placement="bottomLeft"
            >
              <div className={styles['top-bar-left']}>
                <span className={styles['model-name']}>
                  {selectedModelId
                    ? models.find((m) => m.id === selectedModelId)?.modelName ||
                      'AI助手'
                    : 'AI助手'}
                </span>
                <DownOutlined className={styles['dropdown-icon']} />
              </div>
            </Dropdown>
          </div>
          <div className={styles['chat-content']}>
            <div className={styles['chat-messages']} ref={chatContainerRef}>
              {isHistoryLoading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '400px',
                  }}
                >
                  <Spin size="large">
                    <div style={{ padding: 50, textAlign: 'center' }}>
                      加载历史记录中...
                    </div>
                  </Spin>
                </div>
              ) : isNewChat ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div className={styles['new-chat-title']}>{newChatTitle}</div>
                  <div
                    style={{
                      marginTop: 20,
                      display: 'flex',
                      gap: 12,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                  >
                    {sampleQuestions.map((q) => (
                      <button
                        type="button"
                        key={q}
                        onClick={() => handleQuickQuestion(q)}
                        style={{
                          background: '#f5f5f5',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: 20,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#333',
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
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
                            <div
                              style={{ whiteSpace: 'pre-wrap', color: '#333' }}
                            >
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
                              {/* action icons separator - always shown under assistant answer */}
                              <div className={styles['follow-separator']}>
                                <Tooltip title="复制">
                                  <div
                                    className={styles['follow-sep-icon']}
                                    onClick={() => {
                                      if (msg.content) {
                                        navigator.clipboard.writeText(
                                          msg.content,
                                        );
                                        message.success('已复制到剪贴板');
                                      }
                                    }}
                                  >
                                    <CopyOutlined />
                                  </div>
                                </Tooltip>
                                <Tooltip title="刷新">
                                  <div
                                    className={styles['follow-sep-icon']}
                                    onClick={() => {
                                      // 找到上一条用户消息
                                      const msgIndex = messages.findIndex(
                                        (m) => m.id === msg.id,
                                      );
                                      if (msgIndex > 0) {
                                        const prevMsg = messages[msgIndex - 1];
                                        if (prevMsg.role === 'user') {
                                          handleQuickQuestion(prevMsg.content);
                                        }
                                      }
                                    }}
                                  >
                                    <ReloadOutlined />
                                  </div>
                                </Tooltip>
                                <Tooltip title="朗读">
                                  <div
                                    className={styles['follow-sep-icon']}
                                    onClick={() => {
                                      if (msg.content) {
                                        const utterance =
                                          new SpeechSynthesisUtterance(
                                            msg.content,
                                          );
                                        utterance.lang = 'zh-CN';
                                        window.speechSynthesis.speak(utterance);
                                      }
                                    }}
                                  >
                                    <SoundOutlined />
                                  </div>
                                </Tooltip>
                                <Tooltip title="喜欢">
                                  <div
                                    className={`${styles['follow-sep-icon']} ${msg.liked ? styles['active'] : ''}`}
                                    onClick={() => {
                                      setMessages((prev) =>
                                        prev.map((m) =>
                                          m.id === msg.id
                                            ? {
                                                ...m,
                                                liked: !m.liked,
                                                disliked: false,
                                              }
                                            : m,
                                        ),
                                      );
                                    }}
                                  >
                                    {msg.liked ? (
                                      <LikeFilled />
                                    ) : (
                                      <LikeOutlined />
                                    )}
                                  </div>
                                </Tooltip>
                                <Tooltip title="不喜欢">
                                  <div
                                    className={`${styles['follow-sep-icon']} ${msg.disliked ? styles['active'] : ''}`}
                                    onClick={() => {
                                      setMessages((prev) =>
                                        prev.map((m) =>
                                          m.id === msg.id
                                            ? {
                                                ...m,
                                                disliked: !m.disliked,
                                                liked: false,
                                              }
                                            : m,
                                        ),
                                      );
                                    }}
                                  >
                                    {msg.disliked ? (
                                      <DislikeFilled />
                                    ) : (
                                      <DislikeOutlined />
                                    )}
                                  </div>
                                </Tooltip>
                                <Popconfirm
                                  title="删除此消息"
                                  description="确定要删除吗？"
                                  onConfirm={async () => {
                                    try {
                                      // 用户消息和AI消息是同一条数据，id相同
                                      // 判断是AI消息（id以-ai结尾），提取原始id
                                      const msgIdStr = String(msg.id);
                                      const isAiMessage =
                                        msgIdStr.endsWith('-ai');
                                      const originalId = isAiMessage
                                        ? msgIdStr.replace(/-ai$/, '')
                                        : msgIdStr;

                                      // 删除后端记录（使用原始id）
                                      await deleteChatMessage(
                                        sessionIdRef.current,
                                        originalId,
                                      );
                                      message.success('删除成功');

                                      // 同时删除用户消息和AI消息（它们共享同一个id）
                                      setMessages((prev) =>
                                        prev.filter((m) => {
                                          // 用户消息id是原始数字，AI消息id是"数字-ai"格式
                                          // 需要提取原始id进行比较
                                          const mIdStr = String(m.id);
                                          let mOriginalId;
                                          if (mIdStr.endsWith('-ai')) {
                                            // AI消息，去掉-ai后缀
                                            mOriginalId = mIdStr.slice(0, -3);
                                          } else {
                                            // 用户消息，直接使用
                                            mOriginalId = mIdStr;
                                          }
                                          // 精确匹配要删除的消息id
                                          const shouldDelete =
                                            mIdStr === msgIdStr || // 当前点击的消息
                                            mOriginalId === originalId; // 同一条数据的消息
                                          return !shouldDelete;
                                        }),
                                      );
                                    } catch (error) {
                                      message.error('删除失败');
                                    }
                                  }}
                                >
                                  <Tooltip title="删除">
                                    <div
                                      className={styles['follow-sep-icon']}
                                      style={{ color: '#ff4d4f' }}
                                    >
                                      <DeleteOutlined />
                                    </div>
                                  </Tooltip>
                                </Popconfirm>
                              </div>
                              {/* follow-up suggestions (来自后端 followUps 字段) */}
                              {msg.followUps &&
                                Array.isArray(msg.followUps) &&
                                msg.followUps.length > 0 && (
                                  <div className={styles['follow-ups']}>
                                    {msg.followUps.map((f, idx) => (
                                      <div
                                        key={idx}
                                        className={styles['follow-up-item']}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                          // 直接触发问答：将该建议作为用户消息发送
                                          // handleQuickQuestion 内部会读取 selectedKnowledgeDocIds 与 selectedLocalTempFileIds
                                          try {
                                            handleQuickQuestion(f);
                                          } catch (err) {
                                            console.warn(
                                              '触发建议问答失败',
                                              err,
                                            );
                                          }
                                        }}
                                      >
                                        <span
                                          className={styles['follow-up-text']}
                                        >
                                          {f}
                                        </span>
                                        <RightArrowOutlined
                                          className={styles['follow-up-icon']}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              {/* 历史记录中的推荐问题 (来自 questionList 字段) */}
                              {msg.questionList &&
                                Array.isArray(msg.questionList) &&
                                msg.questionList.length > 0 && (
                                  <div className={styles['follow-ups']}>
                                    {msg.questionList.map((q, idx) => (
                                      <div
                                        key={`q-${idx}`}
                                        className={styles['follow-up-item']}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                          try {
                                            handleQuickQuestion(q);
                                          } catch (err) {
                                            console.warn(
                                              '触发推荐问题失败',
                                              err,
                                            );
                                          }
                                        }}
                                      >
                                        <span
                                          className={styles['follow-up-text']}
                                        >
                                          {q}
                                        </span>
                                        <RightArrowOutlined
                                          className={styles['follow-up-icon']}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className={styles['new-chat-container']}>
              <div className={styles['new-chat-input-wrapper']}>
                <div className={styles['image-input-container']}>
                  {/* 第一行：选中文档 */}
                  <div className={styles['selected-docs-area']}>
                    <div className={styles['selected-docs-row']}>
                      {selectedKnowledgeDocIds.map((docId) => {
                        const doc = knowledgeDocs.find((d) => d.id === docId);
                        return doc ? (
                          <div
                            key={`kb-${docId}`}
                            className={`${styles['selected-doc-item']} ${styles['selected-doc-knowledge']}`}
                          >
                            <FileTextOutlined
                              style={{
                                fontSize: 12,
                                marginRight: 4,
                                color: '#1890ff',
                              }}
                            />
                            <span style={{ fontSize: 11 }}>
                              {doc.title || doc.name}
                            </span>
                            <Button
                              type="text"
                              size="small"
                              className={styles['selected-doc-close-btn']}
                              icon={<CloseOutlined />}
                              onClick={() =>
                                removeSelectedDoc({
                                  id: docId,
                                  source: 'knowledge',
                                })
                              }
                            />
                          </div>
                        ) : null;
                      })}
                      {selectedLocalTempFileIds.map((fileId) => {
                        const file = uploadList.find(
                          (f) => f.tempFileId === fileId || f.uid === fileId,
                        );
                        return file ? (
                          <div
                            key={`local-${fileId}`}
                            className={`${styles['selected-doc-item']} ${styles['selected-doc-local']}`}
                          >
                            <FileTextOutlined
                              style={{
                                fontSize: 12,
                                marginRight: 4,
                                color: '#52c41a',
                              }}
                            />
                            <span style={{ fontSize: 11 }}>
                              {file.title || file.name}
                            </span>
                            <Button
                              type="text"
                              size="small"
                              className={styles['selected-doc-close-btn']}
                              icon={<CloseOutlined />}
                              onClick={() =>
                                removeSelectedDoc({
                                  id: fileId,
                                  source: 'local',
                                })
                              }
                            />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* 第二行：输入框（受控组件，支持自动高度调整，最大高度200px） */}
                  <TextArea
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="有问题，尽管问"
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    variant="borderless"
                    disabled={isLoading}
                  />

                  {/* 第三行：功能按钮行（将 + 菜单全部展开为按钮） */}
                  <div className={styles['buttons-row']}>
                    <div
                      className={styles['left-actions']}
                      ref={leftActionsRef}
                    >
                      {/* 按顺序渲染：回形针（第一个），数值分割线，后续功能按钮 */}
                      {menuItems
                        .filter((item) => item.type !== 'divider')
                        .map((item, idx, arr) => {
                          if (item.key === 'add-file') {
                            return (
                              <span
                                key="add-file-wrapper"
                                ref={addFileWrapperRef}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: computedGap
                                    ? `${computedGap}px`
                                    : undefined,
                                }}
                              >
                                <Dropdown
                                  menu={{
                                    items: addFileMenu,
                                    onClick: handleAddFileMenuClick,
                                  }}
                                  trigger={['click']}
                                  placement="top"
                                >
                                  <Button
                                    type="text"
                                    icon={<PaperClipOutlined />}
                                    className={`${styles['inline-action-button']} ${styles['add-file-icon']}`}
                                  />
                                </Dropdown>
                                {/* 如果下一个是 create-image，则在两者之间显示竖线分割 */}
                                {arr[idx + 1] &&
                                  arr[idx + 1].key === 'create-image' && (
                                    <span
                                      className={styles['vertical-divider']}
                                    />
                                  )}
                              </span>
                            );
                          }

                          // regular button for other items (显示图标和文字)
                          return (
                            <Button
                              key={item.key}
                              type="text"
                              icon={item.icon}
                              onClick={() => handleMenuClick({ key: item.key })}
                              className={styles['inline-action-button']}
                            >
                              {typeof item.label === 'string' ? (
                                item.label
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {item.label}
                                </span>
                              )}
                            </Button>
                          );
                        })}
                    </div>
                    <div className={styles['right-actions']}>
                      <SendButton
                        onClick={handleSendOrStop}
                        disabled={!hasInputValue && !isStreaming}
                        loading={isLoading && !isStreaming}
                        isStreaming={isStreaming}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
        {/* 将内容做成列布局：上部固定（搜索输入），下部可伸缩并滚动 */}
        <div
          className={styles['search-modal-content']}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '60vh',
            minHeight: 300,
            gap: 12,
          }}
        >
          {/* 顶部固定区域（不随整体伸缩） */}
          <div style={{ flex: '0 0 auto' }}>
            <Input
              className={styles['search-modal-input']}
              placeholder="搜索聊天..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </div>

          {/* 底部伸缩区：只在此区域内滚动/缩放 */}
          <div
            className={styles['search-modal-list']}
            style={{
              flex: '1 1 auto',
              overflow: 'auto',
              paddingRight: 8,
            }}
          >
            <div className={styles['search-section-title']}>历史聊天</div>
            {filteredHistory.length === 0 && (
              <div className={styles['search-empty']}>暂无匹配结果</div>
            )}
            {filteredHistory.map((chat) => (
              <div key={chat.id} className={styles['search-item']}>
                <span className={styles['search-item-title']}>
                  {chat.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 选择文档弹框 */}
      <Modal
        title="选择文档"
        open={selectDocModalVisible}
        onCancel={() => setSelectDocModalVisible(false)}
        footer={null}
        width={1000}
        maskClosable={false}
        destroyOnClose
        className={styles['select-doc-modal']}
      >
        {/* keep modal at fixed inner height so modal size is consistent across tabs */}
        <div style={{ height: 500, overflow: 'hidden' }}>
          <Tabs
            activeKey={docTabKey}
            onChange={setDocTabKey}
            type="card"
            size="small"
          >
            <Tabs.TabPane tab="知识库文档" key="knowledge">
              {/* keep tab pane at fixed height; layout children with flex so lists can fill remaining space */}
              <div
                style={{
                  height: 420,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {!viewingKnowledgeId ? (
                  // 显示知识库列表
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <div className={styles['kb-list']}>
                      {knowledgeList.length === 0 ? (
                        <Empty description="暂无知识库" />
                      ) : (
                        knowledgeList.map((kb) => (
                          <div
                            key={kb.id}
                            className={styles['kb-row-card']}
                            onClick={() => {
                              handleKnowledgeSwitch(kb.id);
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                              }}
                            >
                              <FolderOutlined
                                style={{ fontSize: 20, color: '#1890ff' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500 }}>
                                  {kb.name || kb.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {/* 已加载全部文档 footer */}
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '16px',
                          color: '#999',
                          fontSize: 12,
                        }}
                      >
                        已加载全部知识库
                      </div>
                    </div>
                  </div>
                ) : (
                  // 显示知识库内的文档列表
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Button
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={() => {
                          setViewingKnowledgeId(null);
                          // preserve modal selections when returning to KB list
                          setModalSearchKeyword('');
                        }}
                        className={styles['select-back-btn']}
                      >
                        返回
                      </Button>
                    </div>
                    <div className={styles['doc-list']}>
                      {getFilteredDocs().length === 0 ? (
                        <Empty description="暂无文档" />
                      ) : (
                        getFilteredDocs().map((doc) => {
                          const currentModalSelected =
                            modalSelectedByKb[viewingKnowledgeId] || [];
                          const isSelected =
                            currentModalSelected.includes(doc.id) ||
                            selectedKnowledgeDocIds.includes(doc.id);
                          return (
                            <div
                              key={doc.id}
                              className={`${styles['doc-row-card']} ${isSelected ? styles['selected'] : ''}`}
                              onClick={() => toggleModalSelectDoc(doc.id)}
                            >
                              <div
                                className={styles['doc-row-inner']}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                }}
                              >
                                <FileTextOutlined
                                  style={{
                                    fontSize: 16,
                                    color: '#666',
                                    flex: '0 0 20px',
                                  }}
                                />
                                <div
                                  className={styles['doc-title']}
                                  style={{ flex: 1 }}
                                >
                                  <div style={{ fontWeight: 500 }}>
                                    {doc.title || doc.fileName}
                                  </div>
                                </div>
                                <div
                                  className={styles['doc-check']}
                                  style={{
                                    flex: '0 0 22px',
                                    textAlign: 'center',
                                  }}
                                >
                                  {isSelected && (
                                    <span
                                      style={{ color: '#52c41a', fontSize: 16 }}
                                    >
                                      ✓
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* 已加载全部文档 footer - 只有在加载完成且有文档时才显示 */}
                      {!knowledgeDocsLoading && knowledgeDocs.length > 0 && (
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '16px',
                            color: '#999',
                            fontSize: 12,
                          }}
                        >
                          已加载全部文档
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab="本地上传" key="local">
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: 12,
                    height: 140,
                    boxSizing: 'border-box',
                    overflow: 'visible',
                  }}
                >
                  <Upload.Dragger
                    multiple
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    beforeUpload={beforeUpload}
                    showUploadList={false}
                    // control Upload's internal fileList from our uploadList state to avoid deleted items reappearing
                    fileList={uploadList.map((u) => ({
                      uid: u.uid,
                      name: u.title,
                      status: u.status === 'success' ? 'done' : u.status,
                      percent: u.progress || 0,
                      originFileObj: u.file || undefined,
                    }))}
                    customRequest={handleLocalCustomRequest}
                    onChange={(info) => {
                      const { file, fileList } = info;
                      // merge antd fileList into uploadList, preserving higher progress/state from existing entries
                      setUploadList((prev) => {
                        const byUid = {};
                        prev.forEach((p) => {
                          byUid[p.uid] = { ...p };
                        });
                        fileList.forEach((f) => {
                          const isClientUpload = !!f.originFileObj;
                          const publishTime = isClientUpload
                            ? new Date().toISOString()
                            : f.lastModifiedDate
                              ? f.lastModifiedDate.toISOString()
                              : (f.response &&
                                  f.response.data &&
                                  f.response.data.publishTime) ||
                                new Date().toISOString();

                          const existing = byUid[f.uid];

                          // infer status conservatively: prefer existing status when unsure to avoid flipping to error prematurely
                          let inferredStatus = 'uploading';
                          if (f.status === 'uploading') {
                            inferredStatus = 'uploading';
                          } else if (f.status === 'done') {
                            if (f.response && f.response.data) {
                              inferredStatus =
                                f.response.data.success === false
                                  ? 'error'
                                  : 'success';
                            } else {
                              // done but no response payload yet -> keep existing or remain uploading
                              inferredStatus =
                                existing && existing.status
                                  ? existing.status
                                  : 'uploading';
                            }
                          } else if (f.status === 'error') {
                            inferredStatus = 'error';
                          } else {
                            inferredStatus =
                              existing && existing.status
                                ? existing.status
                                : 'uploading';
                          }

                          const incoming = {
                            uid: f.uid,
                            title: f.name,
                            publishTime,
                            status: inferredStatus,
                            progress: Math.round(f.percent || 0),
                            file: f.originFileObj || null,
                            tempFileId:
                              f.response &&
                              f.response.data &&
                              f.response.data.data
                                ? f.response.data.data.tempFileId
                                : (existing && existing.tempFileId) || null,
                          };

                          if (existing) {
                            // keep the higher progress value and prefer existing status unless incoming is a definitive terminal state
                            const mergedProgress = Math.max(
                              existing.progress || 0,
                              incoming.progress || 0,
                              1,
                            );
                            const mergedStatus =
                              incoming.status === 'success' ||
                              incoming.status === 'error'
                                ? incoming.status
                                : existing.status || incoming.status;
                            byUid[f.uid] = {
                              ...existing,
                              ...incoming,
                              progress: mergedProgress,
                              status: mergedStatus,
                            };
                          } else {
                            byUid[f.uid] = incoming;
                          }
                        });
                        const mergedList = Object.values(byUid);
                        refreshUploadingCount(mergedList);
                        return mergedList;
                      });

                      if (file.status === 'done') {
                        // 消息已在handleLocalCustomRequest中处理
                      } else if (file.status === 'error') {
                        // 消息已在handleLocalCustomRequest中处理
                      }
                    }}
                    style={{
                      padding: 16,
                      height: '100%',
                      borderRadius: 8,
                      border: '1px dashed #d9d9d9',
                      background: '#fff',
                      overflow: 'visible',
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        点击或将文件拖拽到此处上传
                      </div>
                      <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                        仅支持 PDF/Word，单文件最大 100MB
                      </div>
                    </div>
                  </Upload.Dragger>
                </div>

                <div
                  className={styles['local-upload-list']}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    boxSizing: 'border-box',
                  }}
                >
                  {uploadList.length === 0 ? (
                    <Empty description="暂无数据" />
                  ) : (
                    uploadList.map((record) => {
                      const display = record.publishTime
                        ? moment(record.publishTime).format('YYYY-MM-DD')
                        : '';
                      return (
                        <div
                          key={record.uid}
                          className={styles['upload-row-card']}
                        >
                          <div className={styles['upload-col-title']}>
                            <Input
                              value={record.title}
                              onChange={(e) =>
                                updateItem(record.uid, {
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className={styles['upload-col-publish']}>
                            <Input
                              value={display}
                              readOnly
                              style={{
                                background: '#fafafa',
                                cursor: 'default',
                              }}
                            />
                          </div>
                          <div className={styles['upload-col-status']}>
                            {record.status === 'uploading' && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                <Spin size="small" />
                                <span>
                                  {record.progress
                                    ? `解析中 ${record.progress}%`
                                    : '解析中'}
                                </span>
                              </div>
                            )}
                            {record.status === 'success' && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    background: '#52c41a',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                  }}
                                >
                                  <CheckOutlined style={{ fontSize: 12 }} />
                                </span>
                                <span style={{ color: '#52c41a' }}>
                                  解析成功
                                </span>
                              </div>
                            )}
                            {record.status === 'error' && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    background: '#ff4d4f',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                  }}
                                >
                                  <CloseOutlined style={{ fontSize: 12 }} />
                                </span>
                                <span style={{ color: '#ff4d4f' }}>
                                  解析失败
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={styles['upload-col-actions']}>
                            {record.status === 'uploading' ? (
                              <Button type="text" disabled>
                                上传中
                              </Button>
                            ) : (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Button
                                  type="link"
                                  onClick={() =>
                                    handleRemoveLocalUpload(record.uid)
                                  }
                                >
                                  删除
                                </Button>
                                {record.status === 'error' && (
                                  <Button
                                    type="link"
                                    onClick={() => {
                                      const file = record.file;
                                      if (file) {
                                        handleLocalCustomRequest({
                                          file,
                                          onProgress: () => {},
                                          onSuccess: () => {},
                                          onError: () => {},
                                        });
                                      }
                                    }}
                                  >
                                    重新解析
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>

        {/* modal footer: selected counts and actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 8px',
            borderTop: '1px solid #f0f0f0',
            marginTop: 12,
          }}
        >
          <div style={{ color: '#666', fontSize: 13 }}>
            已选择： 知识库 {combinedKnowledgeCount} 项， 本地{' '}
            {combinedLocalCount} 项
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={() => {
                // Preserve modal selections when cancelling so users can continue selecting later
                setSelectDocModalVisible(false);
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => {
                // 无论当前是知识库页签还是本地上传页签，都先合并知识库内 modal 的选择（如果有）
                handleConfirmKnowledgeSelection();

                // 再合并本地上传中已成功的文件到已选集合（兼容 tempFileId / uid）
                const successfulUploads = (uploadList || []).filter(
                  (u) => u.status === 'success' && (u.tempFileId || u.uid),
                );
                if (successfulUploads.length > 0) {
                  setSelectedLocalTempFileIds((prev) => {
                    const s = new Set(prev || []);
                    successfulUploads.forEach((f) => {
                      if (f.tempFileId) s.add(f.tempFileId);
                      else if (f.uid) s.add(f.uid);
                    });
                    return Array.from(s);
                  });
                }
              }}
            >
              确定
            </Button>
          </div>
        </div>

        {/* 已选择文档展示已移除（按需求） */}
      </Modal>
    </PageContainer>
  );
};

export default withAuth(AskPage);
