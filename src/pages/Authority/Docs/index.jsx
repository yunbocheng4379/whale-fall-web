import React, { useEffect, useState } from 'react';
import { withAuth } from '@/components/Auth';
import { history, useLocation } from 'umi';
import {
  PageContainer,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Tag,
  message,
  Modal,
  Upload,
  Table,
  Input,
  DatePicker,
  Progress,
  Spin,
} from 'antd';
import { EyeOutlined, DeleteOutlined, UploadOutlined, SearchOutlined, LeftOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined, CopyOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { MyIcon } from '@/utils/iconUtil';
import DocumentApi from '@/api/DocumentApi';
import { baseURL } from '@/utils/request';
import moment from 'moment';
import './index.less';

const useQuery = () => {
  const loc = useLocation();
  if (loc && loc.state && Object.keys(loc.state).length > 0) {
    return loc.state;
  }
};

const Docs = () => {
  const query = useQuery();
  const knowledgeId = query.id;
  const knowledgeName = query.name || '知识库';
  const knowledgeDescription = query.description || '';
  const knowledgeUpdateTime = query.updateTime || '';
  const knowledgeDocumentCount = query.documentCount !== undefined ? Number(query.documentCount) : null;
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploadList, setUploadList] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [searchText, setSearchText] = useState('');

  const Dragger = Upload.Dragger;
  const { Search } = Input;
  const [uploadHover, setUploadHover] = useState(false);

  const handleOpenUpload = () => {
    setUploadList([]);
    setUploadVisible(true);
  };

  const confirmDeleteDoc = async (docId) => {
    Modal.confirm({
      title: '确认删除该文档？',
      content: '删除后无法恢复，请谨慎操作',
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await DocumentApi.deleteDocument(docId);
          if (response && response.data && response.data.success !== false) {
            message.success('文档删除成功');
            // 刷新文档列表
            fetchDocs();
          } else {
            message.error(response?.data?.message || '文档删除失败');
          }
        } catch (error) {
          console.error('删除文档失败:', error);
          message.error('删除文档失败，请重试');
        }
      },
    });
  };

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // fetch original content and show in modal
  const handlePreview = async (doc) => {
    // Use client-side `content` field if available (no backend request)
    const content = doc.content || doc.rawContent || doc.text || '';
    if (!content) {
      message.warning('该文档暂无可预览的原始内容');
      return;
    }
    setPreviewTitle(doc.title || '预览文档');
    setPreviewContent(content);
    setPreviewVisible(true);
  };

  // copy content currently shown in preview modal to clipboard
  const handleCopyPreview = async () => {
    try {
      const content = previewContent || '';
      if (!content) {
        message.warning('当前预览内容为空，无法复制');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const ta = document.createElement('textarea');
        ta.value = content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      message.success('已复制到剪贴板');
    } catch (e) {
      console.error('复制失败', e);
      message.error('复制失败');
    }
  };

  // download original file by calling backend and streaming blob
  const handleDownload = async (doc) => {
    try {
      const hide = message.loading('正在下载...', 0);
      const resp = await DocumentApi.downloadOriginal({ id: doc.id });
      hide();
      if (resp) {
        // axios returns response.data as blob when responseType='blob' is set in request util;
        const blob = resp instanceof Blob ? resp : (resp.data || resp);
        const filename = (doc.fileName || doc.title || 'file').replace(/\s+/g, '_');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        message.success('下载已开始');
      } else {
        message.error('下载失败');
      }
    } catch (e) {
      console.error('下载失败', e);
      message.error('下载失败');
    }
  };

  // validate file before upload; return true to allow antd to upload
  const beforeUpload = (file) => {
    const isAllowed =
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(
        file.type,
      ) || file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    if (!isAllowed) {
      message.error('仅支持 PDF/Word 文件');
      return Upload.LIST_IGNORE;
    }
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('文件大小不能超过100MB');
      return Upload.LIST_IGNORE;
    }
    // Prevent uploading a file that already exists in this knowledge (frontend check)
    const existsInDocs = docs.some(
      (d) => (d.fileName && d.fileName === file.name) || (d.title && d.title === file.name),
    );
    if (existsInDocs) {
      message.warning(`${file.name} 已存在于该知识库，不能重复上传`);
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

  // helper to update uploading count
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

  // simulate upload/progress/parsing
  // start real upload to backend and track progress
  const startUploadSimulation = async (item) => {
    const { uid, file, title, publishTime } = item;
    // start at 1%
    updateItem(uid, { status: 'uploading', progress: 1 });

    // Simulate progress over expected backend processing time (default ~30s)
    let progress = 1;
    let stopped = false;
    let backendDone = false;
    let backendSuccess = null;
    const simDuration = 30000; // 30 seconds target to reach ~99%
    const simStart = Date.now();
    const tick = () => {
      const elapsed = Date.now() - simStart;
      const ratio = Math.min(1, elapsed / simDuration);
      // linear from 1% to 99%
      progress = 1 + Math.floor(ratio * (99 - 1));
      updateItem(uid, { progress });
      if (progress >= 99) {
        // reached hold point
        if (backendDone) {
          // finalize now
          stopped = true;
          clearTimeout(timer);
          animateProgress(uid, progress, 100, 300, () =>
            updateItem(uid, { progress: 100, status: backendSuccess ? 'success' : 'error' }),
          );
        }
        return;
      }
      if (!stopped) {
        setTimeout(tick, 300);
      }
    };
    const timer = setTimeout(tick, 200);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title || file.name);
      form.append('knowledgeId', knowledgeId);

      await DocumentApi.uploadDocument(form, knowledgeId, (progressEvent) => {
        if (progressEvent && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // adopt backend progress if it's ahead of simulation
          if (percent > progress && percent < 99) {
            progress = percent;
            updateItem(uid, { progress });
          }
        }
      })
        .then((resp) => {
          // backend indicates done successfully
          backendDone = true;
          backendSuccess = true;
          // if we've already reached hold point (99) the tick handler will finalize, otherwise finalize now after animating to 100
          if (progress >= 99) {
            stopped = true;
            clearTimeout(timer);
            animateProgress(uid, progress, 100, 300, () => updateItem(uid, { progress: 100, status: 'success' }));
          }
        })
        .catch((err) => {
          backendDone = true;
          backendSuccess = false;
          if (progress >= 99) {
            stopped = true;
            clearTimeout(timer);
            animateProgress(uid, progress, 100, 300, () => updateItem(uid, { progress: 100, status: 'error' }));
          }
        });
      // If backend finished but we didn't finalize in then/catch because progress < 99,
      // wait for tick to reach 99 then it will finalize using backendDone flag.
    } catch (e) {
      console.error('上传失败', e);
      stopped = true;
      clearTimeout(timer);
      animateProgress(uid, progress, 100, 300, () => updateItem(uid, { progress: 100, status: 'error' }));
    }
  };

  // custom upload simulation - replace with real API call
  const handleCustomRequest = ({ file, onSuccess, onError }) => {
    // simulate upload delay
    setTimeout(() => {
      try {
        const newItem = {
          uid: file.uid,
          title: file.name,
          publishTime: new Date().toISOString(),
          status: '已上传',
        };
        setUploadList((prev) => [...prev, newItem]);
        onSuccess && onSuccess('ok');
      } catch (e) {
        onError && onError(e);
      }
    }, 600);
  };

  const handleRemoveUploadItem = async (uid) => {
    const itemToRemove = uploadList.find(item => item.uid === uid);
    // 如果文件已上传成功且有tempFileId，则调用后端删除接口
    if (itemToRemove && itemToRemove.status === 'success' && itemToRemove.tempFileId) {
      try {
        const response = await DocumentApi.deleteDocument(itemToRemove.tempFileId);
        if (response && response.data && response.data.success !== false) {
          message.success('文件删除成功');
        } else {
          message.error(response?.data?.message || '文件删除失败');
          return; // 删除失败，不从列表中移除
        }
      } catch (error) {
        console.error('删除文件失败:', error);
        message.error('删除文件失败，请重试');
        return; // 删除失败，不从列表中移除
      }
    }

    // 从前端列表中移除
    setUploadList((prev) => {
      const next = prev.filter((p) => p.uid !== uid);
      refreshUploadingCount(next);
      return next;
    });
  };

  const handleSubmitUploads = async () => {
    try {
      // Ensure uploads finished
      const uploading = uploadList.some((i) => i.status === 'uploading');
      if (uploading) {
        message.warning('还有文件正在上传，请稍候');
        return;
      }
      // TODO: call backend upload endpoint with finalized file info
      message.success('上传成功');
      setUploadVisible(false);
      // refresh document list after upload
      fetchDocs();
    } catch (e) {
      message.error('上传失败');
    }
  };

  const fetchDocs = async (title) => {
    if (!knowledgeId) {
      message.warn('未指定知识库，无法获取文档');
      return;
    }
    setLoading(true);
    try {
      const res = await DocumentApi.getDocumentsByKnowledgeId({ knowledgeBaseId: knowledgeId, title: title });
      if (res && res.data) {
        const data = res.data.data || res.data;
        setDocs(data.documents || data.docs || data || []);
      } else {
        setDocs([]);
      }
    } catch (e) {
      console.error('获取文档列表失败', e);
      message.error('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 前端文档名模糊搜索（与组件分离）
  const performDocSearch = (value) => {
    const key = (value || '').trim().toLowerCase();
    setSearchText(key);
    // 当搜索框为空时，按 Enter 应恢复全部文档（从后端刷新）
    if (!key) {
      fetchDocs();
      return;
    }
    const filtered = docs.filter((d) => {
      const name = (d.title || d.fileName || '').toLowerCase();
      return name.includes(key);
    });
    setDocs(filtered);
  };
 
  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knowledgeId]);

  return (
    <PageContainer title={false} breadcrumb={false}>
      <div className="docs-wrapper">
        {/* Header card */}
        <Card className="docs-header-card">
          <div className="back-btn-wrap">
            <Button
              className="back-btn"
              size="large"
              onClick={() => history.push('/authority/knowledge')}
            >
              <span className="back-btn-label"><LeftOutlined /> 返回</span>
            </Button>
          </div>
          <div className="docs-header-content">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, background: '#5b8cff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MyIcon type="icon-folder" style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{knowledgeName}</div>
                <div style={{ color: '#8c8c8c', marginTop: 8 }}>
                  {knowledgeDescription || `本知识库包含 ${knowledgeDocumentCount !== null ? knowledgeDocumentCount : docs.length} 个文档，您可以在此上传、查看或删除文档。`}
                </div>
                <div className="docs-meta">
                  {knowledgeDocumentCount !== null ? `${knowledgeDocumentCount} 个文档 · ` : `${docs.length} 个文档 · `}
                  最后更新：{knowledgeUpdateTime || (docs.length > 0 ? (docs[0].publishTime ? docs[0].publishTime.split('T')[0] : '-') : '-')}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Search
                  placeholder="搜索文档..."
                  onSearch={(value) => performDocSearch(value)}
                  allowClear
                  style={{ width: 300 }}
              />
              <Button type="primary" icon={<UploadOutlined />} onClick={handleOpenUpload}>上传文档</Button>
            </div>
          </div>
        </Card>

        {/* Documents list */}
        <div className="docs-list-wrapper">
          <div className="docs-list-scroll">
            {(() => {
              const filtered = searchText
                ? docs.filter((d) => {
                    const key = (d.title || d.fileName || '').toLowerCase();
                    return key.includes(searchText.toLowerCase());
                  })
                : docs;
              return filtered && filtered.length > 0 ? (
                filtered.map((d) => (
            <Card key={d.id} style={{ borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
                        <div className="doc-icon-wrap">
                          <MyIcon type="icon-document" style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                          <div className="doc-title">{d.title}</div>
                          <div className="doc-meta">
                            <ClockCircleOutlined className="doc-clock" />
                            <span className="doc-time">发布时间：{(d.publishTime || d.createTime || d.updateTime) ? ((d.publishTime || d.createTime || d.updateTime).split('T')[0]) : '-'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button type="text" icon={<FileTextOutlined />} onClick={() => handlePreview(d)}>预览</Button>
                  <Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownload(d)}>下载</Button>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => confirmDeleteDoc(d.id)}
                  />
                </div>
              </div>
            </Card>
          ))
          ) : (
            <Col span={24}>
              <div style={{ padding: 80, textAlign: 'center' }}>
                <Empty description={false} />
                <div style={{ marginTop: 12, fontSize: 18, color: '#17233b', fontWeight: 600 }}>
                  暂无文档
                </div>
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  上传文档以开始管理文档与内容
                </div>
                <div style={{ marginTop: 18 }}>
                  <Button type="primary" size="middle" onClick={handleOpenUpload} icon={<UploadOutlined />}>
                    上传文档
                  </Button>
                </div>
              </div>
            </Col>
              );
            })()}

            {docs && docs.length > 0 && (
              <div className="docs-list-footer">
                <div className="divider" />
                <div className="footer-label">已加载全部文档</div>
              </div>
            )}
          </div>
        </div>
      {/* Upload Modal */}
      <Modal
        title="上传文件"
        open={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        width={1000}
        footer={null}
        maskClosable={false}
        destroyOnClose
      >
        <div style={{ padding: '12px 24px' }}>
          <Dragger
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
            customRequest={(options) => {
              const { file, onProgress, onSuccess, onError } = options;
              const form = new FormData();
              form.append('file', file);
              form.append('title', file.name);
              form.append('knowledgeId', knowledgeId);

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
                setUploadList(prev =>
                  prev.map(item =>
                    item.uid === file.uid ? { ...item, progress } : item
                  )
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
              DocumentApi.uploadDocument(form, knowledgeId, (progressEvent) => {
                if (progressEvent && progressEvent.total) {
                  const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  // 如果后端进度超过当前进度，更新进度
                  if (percent > currentProgress && percent < 100) {
                    updateProgress(percent);
                  }
                }
              })
                .then((resp) => {
                  backendDone = true;
                  backendSuccess = true;
                  simStopped = true;

                  // 如果前端进度还没到99%，从当前进度缓慢加载到100%
                  // 如果已经到99%，保持在99%然后缓慢到100%
                  const targetProgress = currentProgress >= 99 ? 99 : currentProgress;
                  animateProgress(file.uid, targetProgress, 100, 500, () => {
                    updateProgress(100);
                    setTimeout(() => onSuccess && onSuccess(resp), 120);
                  });
                })
                .catch((err) => {
                  backendDone = true;
                  backendSuccess = false;
                  simStopped = true;

                  // 失败时也从当前进度缓慢加载到100%，然后显示错误
                  const targetProgress = currentProgress >= 99 ? 99 : currentProgress;
                  animateProgress(file.uid, targetProgress, 100, 500, () => {
                    updateProgress(100);
                    setTimeout(() => onError && onError(err), 120);
                  });
                });
            }}
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
                    : (f.response && f.response.data && f.response.data.publishTime) || new Date().toISOString();
                  const incoming = {
                    uid: f.uid,
                    title: f.name,
                    publishTime,
                    status:
                      f.status === 'uploading'
                        ? 'uploading'
                        : f.status === 'done'
                        ? f.response && f.response.data && f.response.data.success === false
                          ? 'error'
                          : 'success'
                        : 'error',
                    progress: Math.round(f.percent || 0),
                    file: f.originFileObj || null,
                    tempFileId: f.response && f.response.data && f.response.data.data ? f.response.data.data.tempFileId : null,
                  };
                  const existing = byUid[f.uid];
                  if (existing) {
                    // keep the higher progress value and prefer existing status unless incoming is done/error
                    const mergedProgress = Math.max(existing.progress || 0, incoming.progress || 0, 1);
                    const mergedStatus = incoming.status === 'success' || incoming.status === 'error' ? incoming.status : existing.status || incoming.status;
                    byUid[f.uid] = { ...existing, ...incoming, progress: mergedProgress, status: mergedStatus };
                  } else {
                    byUid[f.uid] = incoming;
                  }
                });
                const mergedList = Object.values(byUid);
                refreshUploadingCount(mergedList);
                return mergedList;
              });

              if (file.status === 'done') {
                message.success(`${file.name} 上传成功`);
              } else if (file.status === 'error') {
                message.error(`${file.name} 上传失败`);
              }
            }}
            onMouseEnter={() => setUploadHover(true)}
            onMouseLeave={() => setUploadHover(false)}
            style={{
              padding: 18,
              minHeight: 120,
              borderRadius: 8,
              border: '1px dashed #d9d9d9',
              background: '#fff',
              transition: 'transform 180ms ease, box-shadow 180ms ease',
              transform: uploadHover ? 'translateY(-3px) scale(1.01)' : 'none',
              boxShadow: uploadHover ? '0 12px 40px rgba(91,140,255,0.15)' : 'none',
            }}
          >
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <img src="/img/system/word.svg" alt="word" className={`doc-icon ${uploadHover ? 'hover' : ''}`} />
                <img src="/img/system/pdf.svg" alt="pdf" className={`doc-icon ${uploadHover ? 'hover' : ''}`} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>点击或将文件拖拽到此处上传</div>
              <div style={{ marginTop: 8, color: '#8c8c8c' }}>文档格式：仅支持 PDF、Word 文件上传 · 文档大小：文件最大支持100M</div>
            </div>
          </Dragger>

          <div style={{ marginTop: 18 }}>
            <Table
              className="docs-upload-table"
              dataSource={uploadList}
              pagination={false}
              rowKey="uid"
              columns={[
                {
                  title: '标题',
                  dataIndex: 'title',
                  key: 'title',
                  className: 'col-title',
                  render: (t, record) => <Input value={t} style={{ width: '100%' }} onChange={(e) => updateItem(record.uid, { title: e.target.value })} />,
                },
                {
                  title: '发布日期',
                  dataIndex: 'publishTime',
                  key: 'publishTime',
                  className: 'col-publish',
                  render: (t, record) => {
                    const display = t ? (moment(t).format('YYYY-MM-DD')) : '';
                    return <Input value={display} readOnly style={{ width: '100%', background: '#fafafa', cursor: 'default' }} />;
                  },
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  className: 'col-status',
                  render: (_t, record) => {
                    if (record.status === 'uploading') {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                          <Spin size="small" />
                          <span style={{ minWidth: 90 }}>{record.progress ? `解析中 ${record.progress}%` : '解析中'}</span>
                        </div>
                      );
                    }
                    if (record.status === 'success') {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 11, background: '#52c41a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <CheckOutlined style={{ fontSize: 12 }} />
                          </span>
                          <span style={{ color: '#52c41a' }}>解析成功</span>
                        </div>
                      );
                    }
                    if (record.status === 'error') {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 11, background: '#ff4d4f', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <CloseOutlined style={{ fontSize: 12 }} />
                          </span>
                          <span style={{ color: '#ff4d4f' }}>解析失败</span>
                        </div>
                      );
                    }
                    return <span style={{ minWidth: 100 }}>{record.status}</span>;
                  },
                },
                {
                  title: '操作',
                  key: 'op',
                  className: 'col-op',
                  render: (_text, record) => {
                    if (record.status === 'uploading') {
                      return <Button type="text" disabled style={{ minWidth: 72 }}>上传中</Button>;
                    }
                    return (
                      <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="link" onClick={() => handleRemoveUploadItem(record.uid)}>删除</Button>
                        {record.status === 'error' && <Button type="link" onClick={() => startUploadSimulation(record)}>重新解析</Button>}
                      </div>
                    );
                  },
                },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
            <Button onClick={() => setUploadVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleSubmitUploads}
              disabled={uploadingCount > 0 || uploadList.length === 0}
              loading={uploadingCount > 0}
            >
              {uploadingCount > 0 ? `解析中(${uploadingCount})` : '提交'}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Preview Modal */}
      <Modal
        title={previewTitle}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setPreviewVisible(false)}>关闭</Button>
            <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyPreview}>复制内容</Button>
          </div>
        }
        width={800}
      >
        <div style={{ minHeight: 200, maxHeight: '60vh', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {previewLoading ? <Spin /> : (previewContent || '无内容可预览')}
        </div>
      </Modal>
      </div>
    </PageContainer>
  );
};

export default withAuth(Docs);


