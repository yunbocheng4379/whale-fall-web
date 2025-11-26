import LedgerApi from '@/api/LedgerApi';
import { withAuth } from '@/components/Auth';
import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Button,
  Col,
  DatePicker,
  Input,
  message,
  Modal,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import './index.less';

const { Text, Title } = Typography;

const STORAGE_KEY = 'ledger_records_v1';

const typeOptions = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' },
];

const { RangePicker } = DatePicker;

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const PersonAge = () => {
  const [records, setRecords] = useState(() => loadRecords());
  const [categories, setCategories] = useState({});
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [dateRangeInput, setDateRangeInput] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [remark, setRemark] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [amount, setAmount] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const formRef = useRef();
  const actionRef = useRef();
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    getCategories();
  }, []);

  // 当 type 变化时，触发表格刷新，确保默认查询支出数据
  useEffect(() => {
    // 组件加载时或 type 变化时，刷新表格数据
    if (actionRef.current) {
      actionRef.current.reload();
    }
  }, [type]);

  useEffect(() => {
    if (categories && (categories.expense || categories.income)) {
      handleCategories(categories);
    }
  }, [type, categories]);

  const getCategories = async () => {
    try {
      LedgerApi.getCategories().then((res) => {
        if (res.success) {
          setCategories(res?.data?.data);
          handleCategories(res?.data?.data);
        }
      });
    } catch (e) {
      message.error(`获取支出/收入类型数据异常！`).then((r) => {});
    }
  };

  const handleCategories = (categories) => {
    if (!categories) {
      setCategoryOptions([]);
      return;
    }
    const list = type === 'expense' ? categories.expense : categories.income;
    if (!list || !Array.isArray(list)) {
      setCategoryOptions([]);
      return;
    }
    let map = list.map((c) => ({ label: c, value: c }));
    setCategoryOptions(map);
  };

  // 构建分类的 valueEnum（用于表格过滤）
  const categoryValueEnum = useMemo(() => {
    const enumObj = {};
    categoryOptions.forEach((option) => {
      enumObj[option.value] = { text: option.label };
    });
    return enumObj;
  }, [categoryOptions]);

  const columns = [
    {
      title: '日期',
      dataIndex: 'createTime',
      width: 160,
      sorter: true,
      align: 'center',
      render: (_, r) => moment(r.createTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      align: 'center',
      render: (_, r) =>
        r.type === 0 ? (
          <Tag color="red">支出</Tag>
        ) : (
          <Tag color="green">收入</Tag>
        ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      align: 'center',
      filters: true,
      valueEnum: categoryValueEnum,
      render: (_, r) => r.category || '未分类',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <span className={r.type === 0 ? 'ledger-minus' : 'ledger-plus'}>
          {(Number(r.amount) || 0).toFixed(2)}元
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      align: 'center',
    },
    {
      title: '操作',
      width: 160,
      valueType: 'option',
      align: 'center',
      render: (_, r) => [
        <Button type="link" key="edit" onClick={() => handleEdit(r)}>
          编辑
        </Button>,
        <Button type="link" key="del" danger onClick={() => handleDelete(r.id)}>
          删除
        </Button>,
      ],
    },
  ];

  // 计算分类占比（基于表格数据）
  const categoryAgg = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const map = new Map();
    const currentTypeNum = type === 'expense' ? 0 : 1;
    tableData
      .filter((r) => r.type === currentTypeNum)
      .forEach((r) => {
        const cat = r.category || '未分类';
        map.set(cat, (map.get(cat) || 0) + Number(r.amount || 0));
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tableData, type]);

  // 计算总金额
  const totalAmount = useMemo(() => {
    if (!tableData || tableData.length === 0) return 0;
    const currentTypeNum = type === 'expense' ? 0 : 1;
    return tableData
      .filter((r) => r.type === currentTypeNum)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [tableData, type]);

  // 扇形图配置
  const donutOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { bottom: 0, left: 'center' },
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '45%',
          style: {
            text: `${(totalAmount || 0).toFixed(2)}元`,
            fontSize: 20,
            fontWeight: 'bold',
            fill: '#333',
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '55%',
          style: {
            text: type === 'expense' ? '总支出' : '总收入',
            fontSize: 14,
            fill: '#666',
          },
        },
      ],
      series: [
        {
          name: type === 'expense' ? '支出' : '收入',
          type: 'pie',
          radius: ['40%', '70%'],
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: categoryAgg,
        },
      ],
    }),
    [categoryAgg, type, totalAmount],
  );

  const handleOpenNew = () => {
    setEditing(null);
    setModalOpen(true);
    // 重置表单
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        type: type,
        date: new Date(),
        category: undefined,
        amount: undefined,
        note: undefined,
      });
    }, 100);
  };

  const handleEdit = (record) => {
    setEditing(record);
    setModalOpen(true);
    // 转换后端数据格式为表单格式
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        type: record.type === 0 ? 'expense' : 'income',
        date: record.createTime ? moment(record.createTime) : new Date(),
        category: record.category || undefined,
        amount: record.amount || 0,
        note: record.remark || '',
      });
    }, 100);
  };
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '删除记录',
      content: '确认删除该条记录吗？',
      onOk: async () => {
        try {
          const res = await LedgerApi.deleteLedger(id);
          if (res.success && res?.data?.data) {
            message.success('已删除');
            // 刷新表格数据
            if (actionRef.current) {
              actionRef.current.reload();
            }
          } else {
            message.error(res.message || '删除失败');
          }
        } catch (error) {
          console.error('删除记账记录失败:', error);
          message.error('删除失败，请稍后重试');
        }
      },
    });
  };

  // 处理查询按钮点击
  const handleSearch = () => {
    // 将输入框的值赋给查询状态，触发表格刷新
    setDateRange(dateRangeInput);
    setRemark(remarkInput.trim());
    setAmount(amountInput.trim());
  };

  const handleSubmit = async (values) => {
    const rawDate = values.date;
    const m =
      rawDate && typeof rawDate?.toDate === 'function'
        ? moment(rawDate.toDate())
        : moment(rawDate || undefined);

    // 转换为后端需要的格式
    const payload = {
      id: editing?.id,
      type: values.type === 'expense' ? 0 : 1, // 转换为数字：0=支出, 1=收入
      category: values.category,
      amount: Number(values.amount || 0),
      createTime: m?.isValid()
        ? m.format('YYYY-MM-DD HH:mm:ss')
        : moment().format('YYYY-MM-DD HH:mm:ss'),
      remark: values.note || '',
    };

    try {
      let res;
      if (editing) {
        // 编辑记录
        res = await LedgerApi.updateLedger(payload);
      } else {
        // 新增记录
        res = await LedgerApi.addLedger(payload);
      }

      if (res.success && res?.data?.data) {
        message.success(editing ? '已更新' : '已新增');
        setModalOpen(false);
        setEditing(null);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(res.message || (editing ? '更新失败' : '新增失败'));
        return false;
      }
    } catch (error) {
      console.error(editing ? '更新记账记录失败:' : '新增记账记录失败:', error);
      message.error(editing ? '更新失败，请稍后重试' : '新增失败，请稍后重试');
      return false;
    }
  };

  // 后端请求函数
  const fetchLedgerData = async (params, sort, filter) => {
    try {
      // 处理分类过滤：优先使用表格过滤器的分类（支持多选），其次使用顶部筛选的分类
      let filterCategories = undefined;
      if (
        filter?.category &&
        Array.isArray(filter.category) &&
        filter.category.length > 0
      ) {
        // 表格过滤器中的分类（多选）
        filterCategories = filter.category;
      } else if (category) {
        // 顶部筛选的分类（单选，转换为数组）
        filterCategories = [category];
      }

      const requestParams = {
        current: params.current || 1,
        pageSize: params.pageSize || 8,
        type: type === 'expense' ? 0 : 1,
      };

      // 如果有分类过滤，传递分类数组
      if (filterCategories && filterCategories.length > 0) {
        requestParams.categoryList = filterCategories;
      }

      // 处理时间范围
      if (dateRange && dateRange.length === 2) {
        requestParams.startTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
        requestParams.endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }

      // 处理备注模糊搜索
      if (remark && remark.trim()) {
        requestParams.remark = remark.trim();
      }

      // 处理金额搜索
      if (amount && amount.trim()) {
        const amountValue = Number(amount.trim());
        if (!isNaN(amountValue)) {
          requestParams.amount = amountValue;
        }
      }

      // 处理排序
      if (sort && Object.keys(sort).length > 0) {
        const sortKey = Object.keys(sort)[0];
        const sortOrder = sort[sortKey];
        requestParams.sortField = sortKey;
        requestParams.sortOrder = sortOrder === 'ascend' ? 'asc' : 'desc';
      }

      const res = await LedgerApi.getPersonalLedger(requestParams);

      if (res.success) {
        // 更新表格数据用于计算分类占比
        setTableData(res.data.data?.records);
        return {
          data: res.data.data?.records,
          success: true,
          total: res.data.total || res.data.data.length,
        };
      } else {
        setTableData([]);
        return {
          data: [],
          success: true,
          total: 0,
        };
      }
    } catch (error) {
      console.error('获取记账数据失败:', error);
      message.error('获取记账数据失败').then(() => {});
      setTableData([]);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <PageContainer title={false} className="ledger-page">
      <div className="ledger-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            我的账本
          </Title>
          <Text type="secondary">轻松管理每日收支</Text>
        </div>
        <Space>
          <Segmented
            options={[
              { label: '支出', value: 'expense' },
              { label: '收入', value: 'income' },
            ]}
            value={type}
            onChange={setType}
          />
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            value={dateRangeInput}
            onChange={(dates) => setDateRangeInput(dates)}
            placeholder={['开始时间', '结束时间']}
            style={{ width: 360 }}
          />
          <Input
            placeholder="备注搜索"
            value={remarkInput}
            onChange={(e) => setRemarkInput(e.target.value)}
            allowClear
            onPressEnter={() => {
              // 按回车键触发查询
              handleSearch();
            }}
            style={{ width: 200 }}
          />
          <Input
            placeholder="金额搜索"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            allowClear
            onPressEnter={() => {
              // 按回车键触发查询
              handleSearch();
            }}
            style={{ width: 200 }}
          />
          <Button onClick={handleSearch}>查询</Button>
          <Button type="primary" onClick={handleOpenNew}>
            新增记账
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <ProCard
            title={type === 'expense' ? '支出分类占比' : '收入分类占比'}
            bordered
          >
            <ReactECharts
              option={donutOption}
              style={{ height: 400 }}
              notMerge
              lazyUpdate
            />
          </ProCard>
        </Col>
        <Col xs={24} md={16}>
          <ProCard title="记账记录" bordered>
            <ProTable
              actionRef={actionRef}
              rowKey="id"
              search={false}
              options={false}
              pagination={{
                pageSize: 8,
              }}
              request={fetchLedgerData}
              columns={columns}
              params={{
                type: type === 'expense' ? 0 : 1,
                dateRange,
                remark,
                amount,
              }}
              manualRequest={false}
            />
          </ProCard>
        </Col>
      </Row>

      <Modal
        title={editing ? '编辑记账' : '新增记账'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        footer={null}
        destroyOnClose
      >
        <ProForm
          formRef={formRef}
          onFinish={handleSubmit}
          initialValues={{ type, date: new Date() }}
          submitter={{
            searchConfig: { submitText: editing ? '保存' : '新增' },
          }}
        >
          <ProFormRadio.Group
            name="type"
            label="类型"
            options={typeOptions}
            rules={[{ required: true, message: '请选择类型' }]}
            fieldProps={{
              onChange: () =>
                formRef.current?.setFieldValue('category', undefined),
            }}
          />
          <ProFormSelect
            name="category"
            label="分类"
            placeholder="请选择分类"
            options={categoryOptions}
            rules={[{ required: true, message: '请选择分类' }]}
          />
          <ProFormDigit
            name="amount"
            label="金额"
            min={0}
            fieldProps={{ precision: 2, style: { width: '100%' } }}
            rules={[{ required: true, message: '请输入金额' }]}
          />
          <ProFormDateTimePicker
            name="date"
            label="日期"
            fieldProps={{ style: { width: '100%' } }}
            rules={[{ required: true, message: '请选择日期' }]}
          />
          <ProFormTextArea
            name="note"
            label="备注"
            placeholder="可填写商家、项目等"
            fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
          />
        </ProForm>
      </Modal>
    </PageContainer>
  );
};

export default withAuth(PersonAge);
