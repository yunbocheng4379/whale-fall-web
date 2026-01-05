import { withAuth } from '@/components/Auth';
import React, { useEffect, useState } from 'react';
import {
  PageContainer,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Row,
  Space,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { MyIcon } from '@/utils/iconUtil';
import KnowledgeApi from '@/api/KnowledgeApi';
import { history } from 'umi';

const { Search, TextArea } = Input;

const Knowledge = () => {
  const [loading, setLoading] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchLibraries = async (data) => {
    setLoading(true);
    try {
      const response = await KnowledgeApi.getKnowledgeList({name: data});
      console.log(response);
      if (response.success) {
        setLibraries(response.data.data);
      } else {
        setLibraries([]);
      }
    } catch (e) {
      message.error('获取知识库列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  const openCreateModal = () => {
    form.resetFields();
    setCreateVisible(true);
  };

  const handleCreate = async (values) => {
    try {
      const payload = {
        name: values.name,
        description: values.description || '',
      };
      await KnowledgeApi.addKnowledge(payload);
      message.success('知识库创建成功');
      setCreateVisible(false);
      fetchLibraries(searchText);
      return true;
    } catch (e) {
      console.error('创建知识库失败', e);
      message.error('创建知识库失败');
      return false;
    }
  };

  const handleDelete = async (id, vectorIndexName, name) => {
    try {
      setLibraries((prev) => prev.filter((l) => l.id !== id));
      await KnowledgeApi.deleteKnowledge({ id, vectorIndexName, name });
      message.success('已删除知识库');
      await fetchLibraries(searchText);
    } catch (e) {
      console.error('删除知识库失败', e);
      message.error('删除知识库失败');
      fetchLibraries(searchText);
    }
  };

  const confirmDelete = (lib) => {
    Modal.confirm({
      title: '确认删除该知识库？',
      content: lib.name,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        return handleDelete(lib.id, lib.vectorIndexName, lib.name);
      },
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchLibraries(value);
  };

  return (
    <PageContainer title={false}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>文库管理</h2>
            <div style={{ color: '#8c8c8c', marginTop: 8 }}>
              总计：<strong>{libraries.length}</strong> 个文库&nbsp;&nbsp; 文档：<strong>{libraries.reduce((s, l) => s + (l.fileCount || 0), 0)}</strong> 个
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Search
              placeholder="搜索文库..."
              onSearch={handleSearch}
              allowClear
              style={{ width: 300 }}
            />
            <Button type="primary" onClick={openCreateModal}>
              + 新建文库
            </Button>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {libraries && libraries.length > 0 ? libraries.map((lib) => (
            <Col key={lib.id} xs={24} sm={12} md={8} lg={8}>
              <Card className="kb-card" hoverable bodyStyle={{ padding: 20 }} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: '#5b8cff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MyIcon type="icon-folder" style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#17233b' }}>{lib.name}</div>
                    <div style={{ color: '#8c8c8c', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {lib.description || '暂无描述'}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 12 }}>
                  {lib.fileCount || 0} 文档 · 更新：{lib.updateTime ? lib.updateTime.split('T')[0] : '-'}
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                  <div style={{ flex: 1 }}>
                      <Button
                        type="primary"
                        block
                        style={{
                          borderRadius: 6,
                          height: 36,
                          background: 'linear-gradient(180deg, #87a9ff, #5b8cff)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 500,
                        }}
                        onClick={() =>
                          history.push('/authority/docs', {
                            id: lib.id,
                            name: lib.name,
                            description: lib.description || '',
                            updateTime: lib.updateTime || '',
                            documentCount: lib.fileCount || lib.count || 0,
                          })
                        }
                      >
                        进入
                      </Button>
                  </div>

                  <div style={{ marginLeft: 12, flexShrink: 0 }}>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                      style={{ color: '#ff4d4f', padding: 6 }}
                      onClick={() => confirmDelete(lib)}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <div style={{ padding: 80, textAlign: 'center' }}>
                <Empty description={false} />
                <div style={{ marginTop: 12, fontSize: 18, color: '#17233b', fontWeight: 600 }}>
                  暂无知识库
                </div>
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  创建知识库以开始管理文档与内容
                </div>
                <div style={{ marginTop: 18 }}>
                  <Button type="primary" size="middle" onClick={openCreateModal}>
                    + 新建文库
                  </Button>
                </div>
              </div>
            </Col>
          )}
        </Row>

        <Modal
          title="新建知识库"
          open={createVisible}
          onCancel={() => setCreateVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              label="知识库名称"
              name="name"
              rules={[{ required: true, message: '请输入知识库名称（支持中文）' }]}
            >
              <Input maxLength={100} placeholder="请输入知识库名称（支持中文）" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <TextArea rows={4} maxLength={500} placeholder="请输入知识库描述（可选）" />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setCreateVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit">创建</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default withAuth(Knowledge);
