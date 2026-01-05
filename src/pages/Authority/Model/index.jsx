import ModelApi from '@/api/ModelApi';
import { withAuth } from '@/components/Auth';
import {
  DeleteOutlined,
  EditOutlined,
  FormatPainterOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProForm,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Button,
  Descriptions,
  Empty,
  Form,
  Popconfirm,
  Space,
  Tag,
  message,
} from 'antd';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

// 模型分类
const CATEGORY_OPTIONS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Ollama', value: 'ollama' },
  { label: 'DeepSeek', value: 'deepseek' },
];

// 模型类型
const MODEL_TYPE_OPTIONS = [
  { label: 'Chat', value: 'chat' },
  { label: 'Embedding', value: 'embedding' },
];

// 启用状态
const ENABLED_ENUM = {
  true: { text: '启用', status: 'Success' },
  false: { text: '停用', status: 'Default' },
};

// 启用状态选项（用于筛选）
const ENABLED_OPTIONS = [
  { label: '启用', value: true },
  { label: '停用', value: false },
];

// 构建筛选选项（用于表头筛选）
const buildFilterOptions = (options) => {
  return options.map((opt) => ({
    text: opt.label,
    value: opt.value,
  }));
};

const Model = () => {
  const actionRef = useRef();
  const [form] = Form.useForm();
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelDetail, setModelDetail] = useState(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [modelList, setModelList] = useState([]);
  // 用于标记是否需要自动选中第一个模型（删除后重新加载时使用）
  const shouldAutoSelectFirstRef = useRef(false);

  // —— 模型表请求（调用后端API）
  const requestMenus = async (params, sort, filter) => {
    try {
      // 构建请求参数，后端接收 current 和 pageSize
      // 查询列表时，筛选参数使用：categoryList(List<String>), modelTypeList(List<String>), enabledList(List<Boolean>)
      // 新增/修改表单时，使用：category(String), modelType(String), enabled(Boolean)
      const requestParams = {
        current: params.current || 1,
        pageSize: params.pageSize || 10,
      };

      // 处理搜索表单中的文本字段（只有有值时才传递）
      if (params.modelName) {
        requestParams.modelName = params.modelName;
      }
      if (params.basePath) {
        requestParams.basePath = params.basePath;
      }
      if (params.completionsPath) {
        requestParams.completionsPath = params.completionsPath;
      }
      if (params.apiKey) {
        requestParams.apiKey = params.apiKey;
      }

      // 处理表头筛选参数（多选，传递List集合）
      // filter 参数包含表头筛选的值，格式为 { category: [value1, value2], modelType: [value1], enabled: [true] }
      // 查询列表时使用 categoryList、modelTypeList、enabledList

      // categoryList 筛选（多选）- 后端接收 List<String>
      if (
        filter?.category &&
        Array.isArray(filter.category) &&
        filter.category.length > 0
      ) {
        requestParams.categoryList = filter.category;
      } else if (params.category) {
        // 兼容搜索表单中的单选情况
        requestParams.categoryList = Array.isArray(params.category)
          ? params.category
          : [params.category];
      }

      // modelTypeList 筛选（多选）- 后端接收 List<String>
      if (
        filter?.modelType &&
        Array.isArray(filter.modelType) &&
        filter.modelType.length > 0
      ) {
        requestParams.modelTypeList = filter.modelType;
      } else if (params.modelType) {
        // 兼容搜索表单中的单选情况
        requestParams.modelTypeList = Array.isArray(params.modelType)
          ? params.modelType
          : [params.modelType];
      }

      // enabledList 筛选（多选）- 后端接收 List<Boolean>
      if (
        filter?.enabled &&
        Array.isArray(filter.enabled) &&
        filter.enabled.length > 0
      ) {
        // 确保值是布尔类型
        requestParams.enabledList = filter.enabled.map(
          (v) => v === true || v === 'true' || v === 1,
        );
      } else if (params.enabled !== undefined && params.enabled !== null) {
        // 兼容搜索表单中的单选情况
        const enabledValue = Array.isArray(params.enabled)
          ? params.enabled
          : [params.enabled];
        requestParams.enabledList = enabledValue.map(
          (v) => v === true || v === 'true' || v === 1,
        );
      }

      // 处理排序参数
      if (sort && Object.keys(sort).length > 0) {
        const [field, order] = Object.entries(sort)[0];
        requestParams.sortField = field;
        requestParams.sortOrder = order === 'ascend' ? 'asc' : 'desc';
      }

      const response = await ModelApi.getModelList(requestParams);

      // 后端返回格式：R.ok().data("data", page)
      // page 是 IPage<ModelConfigVO>，包含 records, total, current, size
      if (response && response.data) {
        const pageData = response.data.data || response.data;
        const list = pageData.records || pageData.list || [];

        // 更新模型列表
        setModelList(list);

        // 如果需要自动选中第一个模型（删除后重新加载的情况）
        if (shouldAutoSelectFirstRef.current && list.length > 0) {
          shouldAutoSelectFirstRef.current = false;
          // 使用 setTimeout 确保状态更新后再选中第一个模型
          setTimeout(() => {
            const firstModel = list[0];
            setSelectedModel(firstModel);
            // fetchModelDetail 会在 selectedModel 变化时自动调用
          }, 0);
        }

        return {
          data: list,
          success: true,
          total: pageData.total || 0,
        };
      }

      // 如果没有数据，清空列表和选中状态
      setModelList([]);
      setSelectedModel(null);
      setModelDetail(null);
      shouldAutoSelectFirstRef.current = false;

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error('获取模型列表失败:', error);
      message.error('获取模型列表失败');
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // —— 新增/编辑 模型
  const upsertMenu = async (values) => {
    try {
      // 处理模型参数：后端接收 String 类型，需要验证 JSON 格式但保持为字符串
      let modelParameters = values.modelParameters;
      if (typeof modelParameters === 'string' && modelParameters.trim()) {
        // 验证是否为有效的 JSON 格式，但不解析，保持为字符串
        try {
          JSON.parse(modelParameters);
          // 验证通过，保持为字符串格式
        } catch (e) {
          message.error('模型参数格式错误，请输入合法的 JSON 格式');
          return false;
        }
      } else if (modelParameters && typeof modelParameters === 'object') {
        // 如果是对象（不应该发生，但为了兼容性），转换为字符串
        modelParameters = JSON.stringify(modelParameters);
      } else {
        // 空值或 null，传递 null
        modelParameters = null;
      }

      // 新增/修改表单使用：category(String), modelType(String), enabled(Boolean)
      // modelParameters 传递 String 类型（JSON 格式化的字符串）或 null
      const requestData = {
        modelName: values.modelName,
        basePath: values.basePath,
        completionsPath: values.completionsPath,
        apiKey: values.apiKey,
        category: values.category,
        modelType: values.modelType,
        enabled: values.enabled === 1 || values.enabled === true,
        modelParameters: modelParameters,
      };

      if (editingMenu) {
        // 更新模型
        requestData.id = editingMenu.id;
        await ModelApi.updateModel(requestData);
        message.success('模型已更新');
      } else {
        // 新增模型
        await ModelApi.addModel(requestData);
        message.success('模型已新增');
      }

      setMenuModalOpen(false);
      setEditingMenu(null);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      console.error('保存模型失败:', error);
      message.error(editingMenu ? '更新模型失败' : '新增模型失败');
      return false;
    }
  };

  // 获取模型详情
  const fetchModelDetail = useCallback(async (modelId) => {
    if (!modelId) {
      setModelDetail(null);
      return;
    }

    try {
      const response = await ModelApi.getModelById(modelId);
      if (response && response.data) {
        setModelDetail(response.data.data || response.data);
      }
    } catch (error) {
      console.error('获取模型详情失败:', error);
      message.error('获取模型详情失败');
      setModelDetail(null);
    }
  }, []);

  // 当模型列表有数据且没有选中模型时，自动选中第一个
  useEffect(() => {
    if (modelList.length > 0 && !selectedModel) {
      const firstModel = modelList[0];
      setSelectedModel(firstModel);
      // 注意：不在这里调用 fetchModelDetail，由下面的 useEffect 统一处理
    } else if (modelList.length === 0) {
      // 如果列表为空，清空选中状态和详情
      setSelectedModel(null);
      setModelDetail(null);
    }
  }, [modelList, selectedModel]);

  // 当模型列表更新后，如果当前选中的模型不在列表中，清空选中状态并选中第一个
  useEffect(() => {
    if (modelList.length > 0 && selectedModel) {
      // 检查当前选中的模型是否还在列表中
      const isModelExists = modelList.some(
        (model) => model.id === selectedModel.id,
      );
      if (!isModelExists) {
        // 如果选中的模型不在列表中（可能被删除了），清空选中状态
        // 这样会触发上面的 useEffect，自动选中第一个模型
        setSelectedModel(null);
        setModelDetail(null);
      }
    }
  }, [modelList, selectedModel]);

  // 当选中模型变化时，获取详细信息
  useEffect(() => {
    if (selectedModel && selectedModel.id) {
      fetchModelDetail(selectedModel.id);
    } else {
      setModelDetail(null);
    }
  }, [selectedModel, fetchModelDetail]);

  // 当弹窗打开时，根据 editingMenu 设置表单值
  useEffect(() => {
    if (menuModalOpen) {
      if (editingMenu) {
        // 编辑模式：设置编辑数据
        form.setFieldsValue({
          ...editingMenu,
          modelParameters: editingMenu.modelParameters
            ? typeof editingMenu.modelParameters === 'string'
              ? editingMenu.modelParameters
              : JSON.stringify(editingMenu.modelParameters, null, 2)
            : '',
          enabled: editingMenu.enabled ? 1 : 0,
        });
      } else {
        // 新增模式：重置为默认值
        form.setFieldsValue({
          modelName: '',
          basePath: '',
          completionsPath: '',
          apiKey: '',
          category: 'openai',
          modelType: 'chat',
          enabled: 1,
          modelParameters: '',
        });
      }
    }
  }, [menuModalOpen, editingMenu, form]);

  const removeMenu = async (record) => {
    try {
      await ModelApi.deleteModel(record.id);
      message.success('已删除模型');

      // 如果删除的是当前选中的模型，标记需要自动选中第一个模型
      if (selectedModel && selectedModel.id === record.id) {
        // 立即清空选中状态和详情，避免请求已删除的模型详情
        setSelectedModel(null);
        setModelDetail(null);
        // 标记需要在列表重新加载后自动选中第一个模型
        shouldAutoSelectFirstRef.current = true;
      }

      // 重新加载列表
      actionRef.current?.reload();
    } catch (error) {
      console.error('删除模型失败:', error);
      message.error('删除模型失败');
      shouldAutoSelectFirstRef.current = false;
    }
  };

  // —— 模型列表列定义
  const menuColumns = [
    {
      title: '模型名称',
      dataIndex: 'modelName',
      width: 140,
      ellipsis: true,
      fixed: 'left',
      valueType: 'text',
    },
    {
      title: '模型基础路径',
      dataIndex: 'basePath',
      width: 220,
      ellipsis: true,
      valueType: 'text',
    },
    {
      title: '模型请求路径',
      dataIndex: 'completionsPath',
      width: 200,
      render: (_, r) => r.completionsPath || '-',
      ellipsis: true,
      valueType: 'text',
    },
    {
      title: '模型分类',
      dataIndex: 'category',
      width: 140,
      filters: buildFilterOptions(CATEGORY_OPTIONS),
      // 移除 onFilter，让筛选触发后端请求
      search: false,
      render: (_, r) =>
        CATEGORY_OPTIONS.find((c) => c.value === r.category)?.label ||
        r.category ||
        '-',
      ellipsis: true,
    },
    {
      title: '模型类型',
      dataIndex: 'modelType',
      width: 120,
      filters: buildFilterOptions(MODEL_TYPE_OPTIONS),
      // 移除 onFilter，让筛选触发后端请求
      search: false,
      render: (_, r) =>
        MODEL_TYPE_OPTIONS.find((c) => c.value === r.modelType)?.label ||
        r.modelType ||
        '-',
      ellipsis: true,
    },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 100,
      align: 'center',
      filters: buildFilterOptions(ENABLED_OPTIONS),
      // 移除 onFilter，让筛选触发后端请求
      search: false,
      render: (_, r) => (
        <Tag color={r.enabled ? 'green' : 'default'}>
          {r.enabled ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={(e) => {
            e.stopPropagation(); // 阻止事件冒泡，避免触发行的 onClick
            setEditingMenu(record);
            setMenuModalOpen(true);
          }}
        >
          <EditOutlined />
        </Button>,
        <Popconfirm
          key="del"
          title="确认删除该模型？"
          onConfirm={(e) => {
            if (e) {
              e.stopPropagation(); // 阻止事件冒泡
            }
            removeMenu(record);
          }}
        >
          <Button
            danger
            type="link"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡，避免触发行的 onClick
            }}
          />
        </Popconfirm>,
      ],
    },
  ];

  const descriptionColumn = { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 };
  const labelStyle = { width: 160 };
  const contentStyle = { minWidth: 240 };

  return (
    <PageContainer title={false}>
      <ProCard split="vertical" gutter={16} ghost>
        <ProCard title="模型列表" colSpan="58%">
          <ProTable
            rowKey="id"
            actionRef={actionRef}
            columns={menuColumns}
            request={requestMenus}
            scroll={{ x: 1000 }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            search={{
              filterType: 'light',
              labelWidth: 'auto',
            }}
            onChange={(pagination, filters, sorter, extra) => {
              // 当筛选、排序或分页变化时，触发重新加载
              if (
                extra.action === 'filter' ||
                extra.action === 'sort' ||
                extra.action === 'paginate'
              ) {
                actionRef.current?.reload();
              }
            }}
            onRow={(record) => {
              return {
                onClick: () => {
                  setSelectedModel(record);
                  // 注意：不在这里直接调用 fetchModelDetail，由 useEffect 统一处理，避免重复请求
                },
              };
            }}
            toolBarRender={() => [
              <Button
                key="addMenu"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingMenu(null);
                  setMenuModalOpen(true);
                }}
              >
                新增模型
              </Button>,
            ]}
          />
        </ProCard>

        <ProCard title="模型详情" colSpan="42%">
          {modelDetail ? (
            <Descriptions
              column={descriptionColumn}
              size="small"
              bordered
              labelStyle={labelStyle}
              contentStyle={contentStyle}
            >
              <Descriptions.Item label="模型名称">
                {modelDetail.modelName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模型基础路径">
                {modelDetail.basePath || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模型请求路径">
                {modelDetail.completionsPath || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模型类型">
                {MODEL_TYPE_OPTIONS.find(
                  (c) => c.value === modelDetail.modelType,
                )?.label ||
                  modelDetail.modelType ||
                  '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模型分类">
                {CATEGORY_OPTIONS.find((c) => c.value === modelDetail.category)
                  ?.label ||
                  modelDetail.category ||
                  '-'}
              </Descriptions.Item>
              <Descriptions.Item label="API秘钥">
                {modelDetail.apiKey || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模型参数">
                {modelDetail.modelParameters
                  ? (() => {
                      try {
                        // 如果是字符串，尝试解析为JSON对象
                        let jsonObj =
                          typeof modelDetail.modelParameters === 'string'
                            ? JSON.parse(modelDetail.modelParameters)
                            : modelDetail.modelParameters;
                        // 格式化为带缩进的JSON字符串
                        const formattedJson = JSON.stringify(jsonObj, null, 2);
                        return (
                          <pre
                            style={{
                              margin: 0,
                              padding: '8px 12px',
                              backgroundColor: 'transparent',
                              borderRadius: '4px',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily:
                                'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                            }}
                          >
                            {formattedJson}
                          </pre>
                        );
                      } catch (e) {
                        // 如果解析失败，显示原始字符串
                        return (
                          <pre
                            style={{
                              margin: 0,
                              padding: '8px 12px',
                              backgroundColor: 'transparent',
                              borderRadius: '4px',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily:
                                'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                            }}
                          >
                            {typeof modelDetail.modelParameters === 'string'
                              ? modelDetail.modelParameters
                              : JSON.stringify(modelDetail.modelParameters)}
                          </pre>
                        );
                      }
                    })()
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {modelDetail.createTime
                  ? moment(modelDetail.createTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {modelDetail.updateTime
                  ? moment(modelDetail.updateTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={modelDetail.enabled ? 'green' : 'default'}>
                  {modelDetail.enabled ? '启用' : '停用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {modelDetail.createUser || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="修改人">
                {modelDetail.updateUser || '-'}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty description="请选择左侧模型查看详情" />
          )}
        </ProCard>
      </ProCard>

      {/* 新增/编辑 模型 */}
      <ModalForm
        form={form}
        title={editingMenu ? '编辑模型' : '新增模型'}
        open={menuModalOpen}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setMenuModalOpen(false);
            setEditingMenu(null);
            form.resetFields();
          },
        }}
        onFinish={upsertMenu}
      >
        {/* 第一行：模型名称、基础路径、请求路径 */}
        <ProForm.Group gutter={16}>
          <ProFormText
            name="modelName"
            label="模型名称"
            placeholder="gpt-4"
            rules={[{ required: true, message: '请输入模型名称' }]}
            colProps={{ span: 8 }}
          />
          <ProFormText
            name="basePath"
            label="模型基础路径"
            placeholder="https://api.openai.com/v1"
            rules={[{ required: true, message: '请输入模型基础路径' }]}
            colProps={{ span: 8 }}
            fieldProps={{ style: { width: '100%' } }}
          />
          <ProFormText
            name="completionsPath"
            label="模型请求路径"
            placeholder="/chat/completions"
            colProps={{ span: 8 }}
            fieldProps={{ style: { width: '100%' } }}
            required={false}
          />
        </ProForm.Group>

        {/* 第二行：API秘钥、分类、类型 */}
        <ProForm.Group gutter={16}>
          <ProFormText
            name="apiKey"
            label="API秘钥"
            placeholder="sk-****"
            rules={[{ required: true, message: '请输入API秘钥' }]}
            colProps={{ span: 8 }}
          />
          <ProFormSelect
            name="category"
            label="模型分类"
            options={CATEGORY_OPTIONS}
            placeholder="选择模型分类"
            rules={[{ required: true, message: '请选择模型分类' }]}
            colProps={{ span: 8 }}
            fieldProps={{
              style: { width: '200px', display: 'block' },
              allowClear: false,
            }}
          />
          <ProFormSelect
            name="modelType"
            label="模型类别"
            options={MODEL_TYPE_OPTIONS}
            placeholder="选择模型类别"
            rules={[{ required: true, message: '请选择模型类别' }]}
            colProps={{ span: 8 }}
            fieldProps={{
              style: { width: '200px', display: 'block' },
              allowClear: false,
            }}
          />
        </ProForm.Group>

        {/* 第三行：启用状态 */}
        <ProForm.Group gutter={16}>
          <ProFormRadio.Group
            name="enabled"
            label="启用状态"
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
            colProps={{ span: 8 }}
          />
        </ProForm.Group>

        <ProForm.Item
          name="modelParameters"
          label={
            <Space>
              <span>模型参数</span>
              <Button
                type="link"
                size="small"
                icon={<FormatPainterOutlined />}
                onClick={() => {
                  const currentValue = form.getFieldValue('modelParameters');

                  if (!currentValue || !currentValue.trim()) {
                    message.warning('请输入要格式化的内容');
                    return;
                  }

                  try {
                    // 解析JSON
                    const parsed = JSON.parse(currentValue);
                    // 格式化为标准JSON（带缩进）
                    const formatted = JSON.stringify(parsed, null, 2);
                    // 更新表单值
                    form.setFieldsValue({
                      modelParameters: formatted,
                    });
                    message.success('格式化成功');
                  } catch (error) {
                    message.error('JSON格式错误，无法格式化');
                  }
                }}
              >
                格式化
              </Button>
            </Space>
          }
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                try {
                  JSON.parse(value);
                  return Promise.resolve();
                } catch (e) {
                  return Promise.reject(new Error('请输入合法的 JSON 格式'));
                }
              },
            },
          ]}
          colProps={{ span: 24 }}
        >
          <ProFormTextArea
            placeholder='例如：{"temperature":0.2}'
            fieldProps={{
              autoSize: { minRows: 4, maxRows: 8 },
              style: { resize: 'vertical', width: '100%' },
            }}
          />
        </ProForm.Item>
      </ModalForm>
    </PageContainer>
  );
};

export default withAuth(Model);
