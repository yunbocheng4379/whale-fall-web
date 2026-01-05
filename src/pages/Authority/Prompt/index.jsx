
import React, { useEffect, useState } from 'react';
import { withAuth } from '@/components/Auth';
import {
  PageContainer,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  Row,
  Col,
  Tag,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Modal,
  Space,
  Empty,
  Spin,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { MyIcon } from '@/utils/iconUtil';
import PromptApi from '@/api/PromptApi';
import moment from 'moment';

const { TextArea, Search } = Input;
const { Option } = Select;

const Prompt = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('新增提示词');
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  
  const getTagColor = (type) => {
    const t = (type || '').toString();
    // support backend codes and Chinese labels
    switch (t) {
      case 'GENERAL':
      case '通用':
        return 'blue';
      case 'ASK':
      case '问答':
        return 'cyan';
      case 'WRITING':
      case '写作':
        return 'gold';
      case 'PROGRAM':
      case '编程':
        return 'purple';
      case 'TRANSLATION':
      case '翻译':
        return 'green';
      case 'CREATIVITY':
      case '创意':
        return 'magenta';
      default:
        return 'blue';
    }
  };

  const getTypeLabel = (type) => {
    const t = (type || '').toString();
    switch (t) {
      case 'GENERAL':
      case '通用':
        return '通用';
      case 'ASK':
      case '问答':
        return '问答';
      case 'WRITING':
      case '写作':
        return '写作';
      case 'PROGRAM':
      case '编程':
        return '编程';
      case 'TRANSLATION':
      case '翻译':
        return '翻译';
      case 'CREATIVITY':
      case '创意':
        return '创意';
      default:
        return type;
    }
  };

  // 获取提示词列表（仅显示后端返回的数据）
  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await PromptApi.getPromptList({});
      let promptsData = [];

      if (res && res.data) {
        const data = res.data.data || res.data;
        promptsData = data.prompts || data || [];
      }

      setPrompts(promptsData);
    } catch (e) {
      console.error('获取提示词列表失败', e);
      message.error('获取提示词列表失败');
      // 失败时展示空列表
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理：按 name 属性模糊匹配，Enter 或搜索按钮触发
  const handleSearch = (value) => {
    const key = (value || '').trim();
    setSearchText(key);
    if (!key) {
      // empty search -> reload from backend
      fetchPrompts();
      return;
    }

    // Try backend fuzzy search first
    try {
      (async () => {
        const res = await PromptApi.getPromptList({ name: key });
        if (res && res.data) {
          const data = res.data.data || res.data;
          const promptsData = data.prompts || data || [];
          // merge with defaults (keep defaults shown first)
          const defaultPrompts = [];
          const merged = [...defaultPrompts, ...promptsData];
          setPrompts(merged);
          return;
        }
        // fallback to client-side filtering on current list
        const lower = key.toLowerCase();
        const filtered = (prompts || []).filter((p) => (p.name || '').toLowerCase().includes(lower));
        setPrompts(filtered);
      })();
    } catch (e) {
      const lower = key.toLowerCase();
      const filtered = (prompts || []).filter((p) => (p.name || '').toLowerCase().includes(lower));
      setPrompts(filtered);
    }
  };

  // 新增提示词
  const handleAdd = () => {
    setDrawerTitle('新增提示词');
    setCurrentPrompt(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  // 编辑提示词
  const handleEdit = async (prompt) => {
    setDrawerTitle('编辑提示词');
    setCurrentPrompt(prompt);
    try {
      if(prompt.id === null || prompt.id === undefined){
        message.error('提示词ID不能为空');
        return;
      }
      const res = await PromptApi.getPromptById({ id: prompt.id });
      if (res && res.data) {
        const promptData = res.data.data || res.data;
        form.setFieldsValue({
          type: promptData.type,
          code: promptData.code,
          name: promptData.name,
          description: promptData.description,
          template: promptData.template,
          params: promptData.params ? JSON.stringify(promptData.params, null, 2) : '',
          version: promptData.version !== undefined && promptData.version !== null ? promptData.version : 1,
        });
      }
    } catch (e) {
      console.error('获取提示词详情失败', e);
      message.error('获取提示词详情失败');
    }
    setDrawerVisible(true);
  };

  // 删除提示词
  const handleDelete = (prompt) => {
    Modal.confirm({
      title: '确认删除该提示词？',
      content: '删除后无法恢复，请谨慎操作',
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await PromptApi.deletePrompt({ id: prompt.id });
          message.success('删除成功');
          fetchPrompts();
        } catch (e) {
          console.error('删除提示词失败', e);
          message.error('删除失败');
        }
      },
    });
  };

  // 保存提示词
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        params: values.params ? JSON.parse(values.params) : null,
      };

      if (currentPrompt) {
        // 编辑
        submitData.id = currentPrompt.id;
        await PromptApi.updatePrompt(submitData);
        message.success('更新成功');
      } else {
        // 新增
        await PromptApi.addPrompt(submitData);
        message.success('新增成功');
      }

      setDrawerVisible(false);
      fetchPrompts();
    } catch (e) {
      if (e.errorFields) {
        message.error('请检查表单填写');
      } else {
        console.error('保存失败', e);
        message.error('保存失败');
      }
    }
  };

  // 预览提示词模板
  const handlePreview = (prompt) => {
    Modal.info({
      title: `预览 - ${prompt.name}`,
      content: (
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {prompt.template}
          </pre>
        </div>
      ),
      width: 600,
    });
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  return (
    <PageContainer title={false}>
      <div style={{ padding: '12px 24px' }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#8c8c8c', marginTop: 0 }}>
                总计：<strong>{prompts.length}</strong> 个提示词&nbsp;&nbsp;
                最近更新：<strong>{prompts.length > 0 ? moment(prompts[0].updateTime).format('YYYY-MM-DD') : '-'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Search
                placeholder="搜索提示词..."
                onSearch={(value) => handleSearch(value)}
                allowClear
                style={{ width: 300 }}
              />
              <Button type="primary" onClick={handleAdd}>
                + 新增提示词
              </Button>
            </div>
          </div>

          {/* 简要标签展示 */}
          <div style={{ marginBottom: 18 }}>
            <Tag color="blue">通用</Tag>
            <Tag color="cyan">问答</Tag>
            <Tag color="gold">写作</Tag>
            <Tag color="purple">编程</Tag>
            <Tag color="green">翻译</Tag>
            <Tag color="magenta">创意</Tag>
          </div>
        </div>

        {/* 提示词卡片列表 */}
        <Spin spinning={loading}>
          {prompts.length > 0 ? (
            <Row gutter={[16, 16]}>
              {prompts.map((prompt) => (
                <Col xs={24} sm={12} md={8} lg={6} key={prompt.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: '8px',
                      border: '1px solid rgba(16,39,112,0.04)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(91,140,255,0.08)';
                      e.currentTarget.style.border = '1px solid #5b8cff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.border = '1px solid rgba(16,39,112,0.04)';
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    {/* 卡片头部 */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#5b8cff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          flexShrink: 0,
                        }}
                      >
                        <MyIcon type="icon-prompt" style={{ fontSize: 16, color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#262626',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={prompt.name}
                        >
                          {prompt.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {prompt.code}
                        </div>
                      </div>
                    </div>

                    {/* 类型标签 */}
                    <div style={{ marginBottom: '8px' }}>
                      <Tag color={getTagColor(prompt.type)}>{getTypeLabel(prompt.type)}</Tag>
                    </div>

                    {/* 描述 */}
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#595959',
                        lineHeight: '1.5',
                        marginBottom: '12px',
                        height: '36px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                      title={prompt.description || '暂无描述'}
                    >
                      {prompt.description || '暂无描述'}
                    </div>

                    {/* 更新时间 */}
                    <div style={{ fontSize: '12px', color: '#bfbfbf', marginBottom: '12px' }}>
                      更新时间：{moment(prompt.updateTime).format('YYYY-MM-DD HH:mm')}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '12px 0' }} />
                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(prompt)}
                          style={{ padding: '4px 8px' }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(prompt)}
                          style={{ padding: '4px 8px' }}
                        />
                      </div>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(prompt)}
                        style={{ padding: '4px 8px' }}
                      />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Col span={24}>
              <div style={{ padding: 80, textAlign: 'center' }}>
                <Empty description={false} />
                <div style={{ marginTop: 12, fontSize: 18, color: '#17233b', fontWeight: 600 }}>
                  暂无提示词
                </div>
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  创建提示词以开始管理提示词与模板
                </div>
                <div style={{ marginTop: 18 }}>
                  <Button type="primary" size="middle" onClick={handleAdd}>
                    + 新建提示词
                  </Button>
                </div>
              </div>
            </Col>
          )}
        </Spin>

        {/* 新增/编辑抽屉 */}
        <Drawer
          title={drawerTitle}
          width={600}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          footer={
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setDrawerVisible(false)}>取消</Button>
                <Button type="primary" onClick={handleSave}>
                  保存
                </Button>
              </Space>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              type: 'GENERAL',
              version: 1,
            }}
          >
            <Form.Item
              name="type"
              label="提示词类型"
              rules={[{ required: true, message: '请选择提示词类型' }]}
            >
            <Select placeholder="请选择类型">
                <Option value="GENERAL">通用</Option>
                <Option value="ASK">问答</Option>
                <Option value="WRITING">写作</Option>
                <Option value="PROGRAM">编程</Option>
                <Option value="TRANSLATION">翻译</Option>
                <Option value="CREATIVITY">创意</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="code"
              label="唯一标识"
              rules={[
                { required: true, message: '请输入唯一标识' },
                { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '标识只能包含字母、数字、下划线，且不能以数字开头' }
              ]}
            >
              <Input placeholder="请输入唯一标识，如 general_qa" />
            </Form.Item>

            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="请输入模板名称，如「简单问答提示词模板」" />
            </Form.Item>

            <Form.Item
              name="version"
              label="版本号"
              rules={[
                { required: true, message: '请输入版本号（整数，例如 1）' },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null || value === '') return Promise.reject(new Error('请输入版本号'));
                    if (!Number.isInteger(value) || value <= 0) {
                      return Promise.reject(new Error('版本号必须为正整数'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber min={1} step={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="description"
              label="使用说明"
            >
              <TextArea
                placeholder="请输入使用说明（可选）"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              name="template"
              label="模板内容"
              rules={[{ required: true, message: '请输入模板内容' }]}
            >
              <TextArea
                placeholder="请输入模板内容，支持变量如 {query}、{context} 等"
                rows={7}
              />
            </Form.Item>

            <Form.Item
              name="params"
              label="变量定义"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    try {
                      JSON.parse(value);
                      return Promise.resolve();
                    } catch {
                      return Promise.reject(new Error('变量定义必须是有效的JSON格式'));
                    }
                  }
                }
              ]}
            >
              <TextArea
                placeholder='请输入变量定义，JSON格式，如：{"query": "用户问题", "context": "相关上下文"}'
                rows={4}
              />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </PageContainer>
  );
};

export default withAuth(Prompt);
