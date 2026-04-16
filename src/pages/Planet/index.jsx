import PlanetApi from '@/api/PlanetApi';
import { withAuth } from '@/components/Auth';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Checkbox,
  Empty,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Spin,
  Tag as AntTag,
  Upload,
  Select,
} from 'antd';
import Input from 'antd/es/input';
import { useEffect, useState } from 'react';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LinkOutlined,
  UploadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import MarkdownPreview from '@uiw/react-markdown-preview';
import moment from 'moment';
import './index.less';

const { TextArea } = Input;

const contentTypeMap = {
  1: { label: 'Markdown', icon: FileTextOutlined, className: 'typeRichText' },
  2: { label: '链接', icon: LinkOutlined, className: 'typeUrl' },
  3: { label: '文件', icon: UploadOutlined, className: 'typeFile' },
  4: { label: '外部链接', icon: LinkOutlined, className: 'typeUrl' },
};

const Planet = () => {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    contentType: 1,
    url: '',
    status: 1,
    tagIds: [],
  });
  const [tags, setTags] = useState([]);
  const [myCardsModalOpen, setMyCardsModalOpen] = useState(false);
  const [myCards, setMyCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    fetchCards();
    fetchTags();
    setRenderKey((prev) => prev + 1);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, []);

  useEffect(() => {
    fetchCards();
  }, [current, keyword, contentTypeFilter, tagFilter]);

  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'));
    };
    handleResize();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await PlanetApi.getKnowledgeCardPage({
        current,
        pageSize,
        keyword: keyword || undefined,
        contentType: contentTypeFilter || undefined,
        tagId: tagFilter || undefined,
      });
      if (res.success) {
        const pageData = res.data?.page;
        setCards(pageData?.records || []);
        setTotal(pageData?.total || 0);
      }
    } catch (e) {
      message.error('获取知识卡片列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await PlanetApi.getAllTags();
      if (res.success) {
        setTags(res.data?.list || []);
      }
    } catch (e) {
      console.error('获取标签列表失败', e);
    }
  };

  const handleSearch = () => {
    setCurrent(1);
    fetchCards();
  };

  const handlePageChange = (page) => {
    setCurrent(page);
  };

  const handleTypeFilterChange = (type) => {
    setContentTypeFilter(type === contentTypeFilter ? null : type);
    setCurrent(1);
  };

  const handleAddCard = () => {
    setEditingCard(null);
    setFormData({
      title: '',
      summary: '',
      content: '',
      contentType: 1,
      url: '',
      status: 1,
      tagIds: [],
    });
    setModalOpen(true);
  };

  const handleEditCard = (card, e) => {
    e?.stopPropagation();
    setEditingCard(card);
    setFormData({
      id: card.id,
      title: card.title,
      summary: card.summary,
      content: card.content || '',
      contentType: card.contentType,
      url: card.url || '',
      status: card.status,
      tagIds: card.tags?.map((t) => t.id) || [],
    });
    setModalOpen(true);
  };

  const handleDeleteCard = async (id, e) => {
    e?.stopPropagation();
    try {
      const res = await PlanetApi.deleteKnowledgeCard(id);
      if (res.success) {
        message.success('删除成功');
        fetchCards();
      }
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedCardIds.length === 0) {
      message.warning('请先选择要删除的卡片');
      return;
    }
    try {
      await Promise.all(selectedCardIds.map((id) => PlanetApi.deleteKnowledgeCard(id)));
      message.success(`成功删除 ${selectedCardIds.length} 个卡片`);
      setSelectedCardIds([]);
      setMyCardsModalOpen(false);
      fetchCards();
    } catch (e) {
      message.error('批量删除失败');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCardIds(myCards.map((card) => card.id));
    } else {
      setSelectedCardIds([]);
    }
  };

  const handleSelectCard = (cardId, checked) => {
    if (checked) {
      setSelectedCardIds([...selectedCardIds, cardId]);
    } else {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      message.warning('请输入标题');
      return;
    }
    if (formData.contentType === 1 && !formData.content) {
      message.warning('请输入内容');
      return;
    }
    if (formData.contentType === 2 && !formData.url) {
      message.warning('请输入URL');
      return;
    }

    try {
      const res = editingCard
        ? await PlanetApi.updateKnowledgeCard(formData)
        : await PlanetApi.addKnowledgeCard(formData);
      if (res.success) {
        message.success(editingCard ? '更新成功' : '创建成功');
        setModalOpen(false);
        fetchCards();
      }
    } catch (e) {
      message.error(editingCard ? '更新失败' : '创建失败');
    }
  };

  const handleViewCard = async (card) => {
    try {
      const res = await PlanetApi.getKnowledgeCardById(card.id);
      if (res.success) {
        setDetailData(res.data?.data);
        setDetailModalOpen(true);
      }
    } catch (e) {
      message.error('获取详情失败');
    }
  };

  const handleMyCards = async () => {
    try {
      const res = await PlanetApi.getMyKnowledgeCards();
      if (res.success) {
        setMyCards(res.data?.list || []);
        setMyCardsModalOpen(true);
      }
    } catch (e) {
      message.error('获取我的知识卡片失败');
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await PlanetApi.uploadFile(file);
      if (res.success) {
        const uploadedFile = res.data?.data;
        if (uploadedFile) {
          setFormData({
            ...formData,
            fileUrl: uploadedFile.fileUrl,
            fileName: uploadedFile.fileName,
          });
        }
        message.success('上传成功');
      }
    } catch (e) {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 1).toUpperCase();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loadingOverlay">
          <Spin size="large" />
        </div>
      );
    }

    if (cards.length === 0) {
      return (
        <div className="emptyState">
          <div className="emptyIcon">
            <StarOutlined />
          </div>
          <div className="emptyText">还没有知识卡片</div>
          <div className="emptyHint">点击上方按钮创建第一个知识卡片</div>
        </div>
      );
    }

    return (
      <div className="cardsGrid">
        {cards.map((card, index) => {
          const typeInfo = contentTypeMap[card.contentType] || contentTypeMap[1];
          const TypeIcon = typeInfo.icon;

          return (
            <div
              key={card.id}
              className="knowledgeCard"
              style={{ animationDelay: `${index * 0.08}s` }}
              onClick={() => handleViewCard(card)}
            >
              <div className="cardHeader">
                <span className={`cardType ${typeInfo.className}`}>
                  <TypeIcon style={{ marginRight: 4 }} />
                  {typeInfo.label}
                </span>
                <span className="viewCount">
                  <EyeOutlined className="eyeIcon" />
                  {card.viewCount || 0}
                </span>
              </div>

              <div className="cardTitle">{card.title}</div>

              {card.summary && <div className="cardSummary">{card.summary}</div>}

              <div className="cardFooter">
                <div className="author">
                  <div className="avatar">{getInitials(card.userName)}</div>
                  <span className="authorName">{card.userName}</span>
                </div>
                <span className="cardDate">
                  {moment(card.createTime).format('MM-DD')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageContainer title={false} pageHeaderRender={false}>
      <div className="pageContainer" key={`planet-${renderKey}`}>
        <div className="planetOrbit orbit1" />
        <div className="planetOrbit orbit2" />
        <div className="stars">
          <div className="star" />
          <div className="star" />
          <div className="star" />
        </div>

        <div className="searchSection">
          <div className="searchWrapper">
            <SearchOutlined className="searchIcon" />
            <input
              type="text"
              placeholder="搜索知识内容..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button type="button" className="searchBtn" onClick={handleSearch}>
              搜索
            </button>
          </div>
        </div>

        <div className="pageToolbar">
          <div className="filterTags">
            {[1, 2, 3].map((type) => {
              const typeInfo = contentTypeMap[type];
              const TypeIcon = typeInfo.icon;
              return (
                <div
                  key={type}
                  className={`filterTag ${contentTypeFilter === type ? 'active' : ''}`}
                  onClick={() => handleTypeFilterChange(type)}
                >
                  <TypeIcon />
                  {typeInfo.label}
                </div>
              );
            })}
            <div className="filterTag" onClick={handleMyCards}>
              <EditOutlined />
              我的卡片
            </div>
            <Select
              placeholder="按标签筛选"
              allowClear
              style={{ width: 140, marginLeft: 8 }}
              value={tagFilter}
              onChange={(value) => {
                setTagFilter(value);
                setCurrent(1);
              }}
              options={tags.map((tag) => ({
                label: tag.name,
                value: tag.id,
              }))}
            />
          </div>

          <button type="button" className="addBtn" onClick={handleAddCard}>
            <PlusOutlined />
            创建知识
          </button>
        </div>

        {renderContent()}

        {total > 0 && (
          <div className="pagination">
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
            />
          </div>
        )}
      </div>

      <Modal
        title={editingCard ? '编辑知识卡片' : '创建知识卡片'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={720}
        okText={editingCard ? '更新' : '创建'}
        cancelText="取消"
      >
        <div className="modalForm">
          <div className="formSection">
            <div className="sectionTitle">基本信息</div>
            <Input
              placeholder="请输入知识标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ marginBottom: 12 }}
            />
            <TextArea
              placeholder="请输入知识摘要（可选）"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={2}
            />
          </div>

          <div className="formSection">
            <div className="sectionTitle">内容类型</div>
            <div className="contentTypeSelector">
              {[1, 2, 3].map((type) => {
                const typeInfo = contentTypeMap[type];
                const TypeIcon = typeInfo.icon;
                return (
                  <div
                    key={type}
                    className={`typeOption ${formData.contentType === type ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, contentType: type })}
                  >
                    <div className="typeIcon">
                      <TypeIcon />
                    </div>
                    <div className="typeLabel">{typeInfo.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="formSection">
            <div className="sectionTitle">选择标签</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag) => (
                <AntTag.CheckableTag
                  key={tag.id}
                  checked={formData.tagIds.includes(tag.id)}
                  onChange={(checked) => {
                    if (checked) {
                      setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] });
                    } else {
                      setFormData({ ...formData, tagIds: formData.tagIds.filter((id) => id !== tag.id) });
                    }
                  }}
                  style={{
                    backgroundColor: formData.tagIds.includes(tag.id) ? tag.color : 'transparent',
                    color: formData.tagIds.includes(tag.id) ? '#fff' : tag.color,
                    borderColor: tag.color,
                    padding: '2px 12px',
                    fontSize: 13,
                  }}
                >
                  {tag.name}
                </AntTag.CheckableTag>
              ))}
            </div>
            {formData.tagIds.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                {'未选择标签将默认归为"其他"类别'}
              </div>
            )}
          </div>

          {formData.contentType === 1 && (
            <div className="formSection">
              <div className="sectionTitle">Markdown 内容</div>
              <div data-color-mode="light">
                <MDEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value || '' })}
                  height={300}
                  preview="live"
                />
              </div>
            </div>
          )}

          {formData.contentType === 2 && (
            <div className="formSection">
              <div className="sectionTitle">链接地址</div>
              <Input
                placeholder="请输入URL地址"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
          )}

          {formData.contentType === 3 && (
            <div className="formSection">
              <div className="sectionTitle">上传文件</div>
              <Upload
                name="file"
                customRequest={({ file }) => handleUpload(file)}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  点击上传文件
                </Button>
              </Upload>
              {formData.fileName && (
                <div style={{ marginTop: 8, color: '#52c41a' }}>
                  已上传: {formData.fileName}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="我的知识卡片"
        open={myCardsModalOpen}
        onCancel={() => {
          setMyCardsModalOpen(false);
          setSelectedCardIds([]);
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Checkbox
              indeterminate={selectedCardIds.length > 0 && selectedCardIds.length < myCards.length}
              checked={myCards.length > 0 && selectedCardIds.length === myCards.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              全选
            </Checkbox>
            <Button
              danger
              disabled={selectedCardIds.length === 0}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除选中的 ${selectedCardIds.length} 个卡片吗？`,
                  okText: '确认',
                  cancelText: '取消',
                  onOk: handleBatchDelete,
                });
              }}
            >
              批量删除 {selectedCardIds.length > 0 && `(${selectedCardIds.length})`}
            </Button>
          </div>
        }
        width={800}
      >
        {myCards.length === 0 ? (
          <Empty description="您还没有创建知识卡片" />
        ) : (
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            {myCards.map((card) => {
              const typeInfo = contentTypeMap[card.contentType] || contentTypeMap[1];

              return (
                <div
                  key={card.id}
                  style={{
                    padding: 16,
                    border: '1px solid #e8e8e8',
                    borderRadius: 8,
                    marginBottom: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: selectedCardIds.includes(card.id) ? '#f0f7ff' : '#fff',
                    transition: 'background 0.2s',
                  }}
                >
                  <Checkbox
                    checked={selectedCardIds.includes(card.id)}
                    onChange={(e) => handleSelectCard(card.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ flex: 1, marginLeft: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {typeInfo.label} | {moment(card.createTime).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setMyCardsModalOpen(false);
                        handleEditCard(card);
                      }}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定删除这个知识卡片吗？"
                      onConfirm={() => {
                        setMyCardsModalOpen(false);
                        handleDeleteCard(card.id);
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal
        title={detailData?.title}
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          fetchCards();
        }}
        footer={null}
        width={900}
      >
        {detailData && (
          <div>
            <div style={{ marginBottom: 16, color: '#666' }}>
              <span style={{ marginRight: 16 }}>
                作者: {detailData.userName}
              </span>
              <span style={{ marginRight: 16 }}>
                类型: {contentTypeMap[detailData.contentType]?.label}
              </span>
              <span>浏览: {detailData.viewCount || 0} 次</span>
            </div>

            {detailData.tags && detailData.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {detailData.tags.map((tag) => (
                  <AntTag
                    key={tag.id}
                    color={tag.color}
                    style={{ marginRight: 8 }}
                  >
                    {tag.name}
                  </AntTag>
                ))}
              </div>
            )}

            {detailData.summary && (
              <div
                style={{
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                {detailData.summary}
              </div>
            )}

            {detailData.contentType === 1 && detailData.content && (
              <div style={{ lineHeight: 1.8 }}>
                <MarkdownPreview source={detailData.content} />
              </div>
            )}

            {detailData.contentType === 2 && detailData.url && (
              <div>
                <p style={{ color: '#666' }}>链接地址:</p>
                <a href={detailData.url} target="_blank" rel="noopener noreferrer">
                  {detailData.url}
                </a>
              </div>
            )}

            {detailData.contentType === 3 && detailData.fileUrl && (
              <div>
                <p style={{ color: '#666' }}>附件:</p>
                <a href={detailData.fileUrl} target="_blank" rel="noopener noreferrer">
                  下载文件
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default withAuth(Planet);
