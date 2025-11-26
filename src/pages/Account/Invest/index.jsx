import InvestApi from '@/api/InvestApi';
import { withAuth } from '@/components/Auth';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
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
  message,
  Modal,
  Radio,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import './index.less';

const { RangePicker } = DatePicker;

const { Text, Title } = Typography;

const directionOptions = [
  { label: '买入', value: 'buy' },
  { label: '卖出', value: 'sell' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatAmountWithUnit(amount) {
  const value = Number(amount || 0);
  return `${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 元`;
}

function formatPercent(value) {
  const num = Number(value || 0);
  const formatted = (num * 100).toFixed(1);
  return `${formatted}%`;
}

const Invest = () => {
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [dateRangeInput, setDateRangeInput] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [directionFilter, setDirectionFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const formRef = useRef();
  const actionRef = useRef();
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    fetchInvestmentTypes();
  }, []);

  const fetchInvestmentTypes = () => {
    try {
      InvestApi.getInvestRecords().then((res) => {
        if (res.success) {
          setInvestmentTypes(res?.data?.data);
        }
      });
    } catch (e) {
      message.error(`获取投资类型数据异常！`).then((r) => {});
      setInvestmentTypes([]);
    }
  };

  const investmentTypeEnum = useMemo(
    () =>
      investmentTypes.reduce((acc, t) => ({ ...acc, [t]: { text: t } }), {}),
    [investmentTypes],
  );
  const investmentTypeOptions = useMemo(
    () => investmentTypes.map((t) => ({ label: t, value: t })),
    [investmentTypes],
  );

  const columns = [
    {
      title: '日期',
      dataIndex: 'createTime',
      width: 160,
      align: 'center',
      sorter: true,
      render: (_, r) => moment(r.createTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '方向',
      dataIndex: 'type',
      width: 80,
      align: 'center',
      render: (_, r) => {
        const isSell = r.type === true || r.type === 1;
        return isSell ? (
          <Tag color="red">卖出</Tag>
        ) : (
          <Tag color="green">买入</Tag>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'category',
      width: 100,
      align: 'center',
      filters: true,
      valueEnum: investmentTypeEnum,
      render: (_, r) => r.category || '未分类',
    },
    {
      title: '数量',
      dataIndex: 'num',
      align: 'center',
      render: (_, r) => r.num || 0,
    },
    {
      title: '单价',
      dataIndex: 'price',
      align: 'center',
      render: (_, r) => formatCurrency(r.price),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      align: 'center',
      render: (_, r) => formatCurrency(r.amount),
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

  const stats = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return { totalInvested: 0, totalSell: 0, balance: 0 };
    }
    const totalInvested = tableData
      .filter((r) => r.type === false || r.type === 0)
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalSell = tableData
      .filter((r) => r.type === true || r.type === 1)
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const balance = totalSell - totalInvested;
    return { totalInvested, totalSell, balance };
  }, [tableData]);

  const buyCount = useMemo(
    () => tableData.filter((r) => r.type === false || r.type === 0).length,
    [tableData],
  );
  const sellCount = useMemo(
    () => tableData.filter((r) => r.type === true || r.type === 1).length,
    [tableData],
  );
  const balanceRate = useMemo(() => {
    if (!stats.totalInvested) return 0;
    return stats.balance / stats.totalInvested;
  }, [stats]);

  const typeAgg = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const map = new Map();
    tableData.forEach((r) => {
      const cat = r.category || '未分类';
      map.set(cat, (map.get(cat) || 0) + Number(r.amount || 0));
    });
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, value: v }));
  }, [tableData]);

  const trendAgg = useMemo(() => {
    if (!tableData || tableData.length === 0) return { days: [], values: [] };
    const map = new Map();
    tableData.forEach((r) => {
      const key = moment(r.createTime).format('MM-DD');
      const isSell = r.type === true || r.type === 1;
      map.set(
        key,
        (map.get(key) || 0) + (isSell ? 1 : -1) * Number(r.amount || 0),
      );
    });
    const days = Array.from(map.keys()).sort();
    return { days, values: days.map((d) => Number(map.get(d) || 0)) };
  }, [tableData]);

  const pieOption = useMemo(() => {
    const buyText = formatAmountWithUnit(stats.totalInvested);
    const sellText = formatAmountWithUnit(stats.totalSell);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          name: '投资类型占比',
          type: 'pie',
          radius: ['50%', '75%'],
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: typeAgg,
        },
      ],
      graphic: [
        {
          type: 'group',
          left: 'center',
          top: 'center',
          children: [
            {
              type: 'text',
              top: -40,
              style: {
                text: '买入',
                textAlign: 'center',
                fill: '#8c8c8c',
                fontSize: 12,
              },
            },
            {
              type: 'text',
              top: -18,
              style: {
                text: buyText,
                textAlign: 'center',
                fill: '#262626',
                fontWeight: 600,
                fontSize: 16,
              },
            },
            {
              type: 'text',
              top: 10,
              style: {
                text: '卖出',
                textAlign: 'center',
                fill: '#8c8c8c',
                fontSize: 12,
              },
            },
            {
              type: 'text',
              top: 32,
              style: {
                text: sellText,
                textAlign: 'center',
                fill: '#262626',
                fontWeight: 600,
                fontSize: 16,
              },
            },
          ],
        },
      ],
    };
  }, [typeAgg, stats.totalInvested, stats.totalSell]);

  const lineOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: trendAgg.days, boundaryGap: false },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          data: trendAgg.values,
          smooth: true,
          areaStyle: {},
          symbol: 'circle',
        },
      ],
    }),
    [trendAgg],
  );

  const statCards = useMemo(() => {
    const avgBuy = buyCount ? stats.totalInvested / buyCount : 0;
    const avgSell = sellCount ? stats.totalSell / sellCount : 0;
    const hasInvested = stats.totalInvested > 0;
    const rateText = hasInvested
      ? `${balanceRate >= 0 ? '+' : ''}${formatPercent(balanceRate)}`
      : '—';
    return [
      {
        key: 'buy',
        title: '累计买入',
        hint: '资金流入',
        value: stats.totalInvested,
        pillText: `${buyCount} 笔`,
        pillType: 'neutral',
        footerLabel: '单笔均额',
        footerValue: formatAmountWithUnit(avgBuy),
        icon: <ArrowDownOutlined />,
        variant: 'buy',
      },
      {
        key: 'sell',
        title: '累计卖出',
        hint: '资金流出',
        value: stats.totalSell,
        pillText: `${sellCount} 笔`,
        pillType: 'neutral',
        footerLabel: '单笔均额',
        footerValue: formatAmountWithUnit(avgSell),
        icon: <ArrowUpOutlined />,
        variant: 'sell',
      },
      {
        key: 'profit',
        title: '投资收益',
        hint: stats.balance >= 0 ? '收益达成' : '存在亏损',
        value: stats.balance,
        pillText: hasInvested ? `收益率 ${rateText}` : '暂无收益',
        pillType: stats.balance >= 0 ? 'positive' : 'negative',
        footerLabel: '买入成本',
        footerValue: formatAmountWithUnit(stats.totalInvested),
        icon: <LineChartOutlined />,
        variant: 'profit',
      },
    ];
  }, [stats, buyCount, sellCount, balanceRate]);

  // 处理查询按钮点击
  const handleSearch = () => {
    setDateRange(dateRangeInput);
    if (actionRef.current) {
      actionRef.current.reload();
    }
  };

  // 处理方向筛选变化
  const handleDirectionFilterChange = (e) => {
    setDirectionFilter(e.target.value);
    if (actionRef.current) {
      actionRef.current.reload();
    }
  };

  const handleOpenNew = () => {
    setEditing(null);
    setModalOpen(true);
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        direction: 'buy',
        type: undefined,
        quantity: undefined,
        price: undefined,
        date: new Date(),
        note: undefined,
      });
    }, 100);
  };

  const handleEdit = (record) => {
    setEditing(record);
    setModalOpen(true);
    setTimeout(() => {
      const isSell = record.type === true || record.type === 1;
      formRef.current?.setFieldsValue({
        direction: isSell ? 'sell' : 'buy',
        type: record.category || undefined,
        quantity: record.num || 0,
        price: record.price || 0,
        date: record.createTime ? moment(record.createTime) : new Date(),
        note: record.remark || '',
      });
    }, 100);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '删除记录',
      content: '确认删除该条投资记录吗？',
      onOk: async () => {
        try {
          const res = await InvestApi.deleteInvestment(id);
          if (res.success && res?.data?.data) {
            message.success('已删除');
            if (actionRef.current) {
              actionRef.current.reload();
            }
          } else {
            message.error(res.message || '删除失败');
          }
        } catch (error) {
          console.error('删除投资记录失败:', error);
          message.error('删除失败，请稍后重试');
        }
      },
    });
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
      type: values.direction === 'sell' ? true : false,
      category: values.type,
      num: Number(values.quantity || 0),
      price: Number(values.price || 0),
      amount: Number(values.quantity || 0) * Number(values.price || 0),
      createTime: m?.isValid()
        ? m.format('YYYY-MM-DD HH:mm:ss')
        : moment().format('YYYY-MM-DD HH:mm:ss'),
      remark: values.note || '',
    };

    try {
      let res;
      if (editing) {
        res = await InvestApi.updateInvestment(payload);
      } else {
        res = await InvestApi.addInvestment(payload);
      }

      if (res.success && res?.data?.data) {
        message.success(editing ? '已更新' : '已新增');
        setModalOpen(false);
        setEditing(null);
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        if (!res?.message) {
          message.error(editing ? '更新失败' : '新增失败');
        }
        return false;
      }
    } catch (error) {
      console.error(editing ? '更新投资记录失败:' : '新增投资记录失败:', error);
      if (!error?.response?.data?.message) {
        message.error(
          editing ? '更新失败，请稍后重试' : '新增失败，请稍后重试',
        );
      }
      return false;
    }
  };

  // 后端请求函数
  const fetchInvestmentData = async (params, sort, filter) => {
    try {
      const requestParams = {
        current: params.current || 1,
        pageSize: params.pageSize || 8,
      };

      // 处理方向过滤（从外部筛选器获取）
      if (directionFilter === 'buy') {
        requestParams.type = false;
      } else if (directionFilter === 'sell') {
        requestParams.type = true;
      }
      // directionFilter === 'all' 时不传 type 参数，获取全部数据

      // 处理时间范围
      if (dateRange && dateRange.length === 2) {
        requestParams.startTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
        requestParams.endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }

      // 处理分类过滤
      if (
        filter?.category &&
        Array.isArray(filter.category) &&
        filter.category.length > 0
      ) {
        requestParams.categoryList = filter.category;
      }

      // 处理排序
      if (sort && Object.keys(sort).length > 0) {
        const sortKey = Object.keys(sort)[0];
        const sortOrder = sort[sortKey];
        requestParams.sortField = sortKey;
        requestParams.sortOrder = sortOrder === 'ascend' ? 'asc' : 'desc';
      }

      const res = await InvestApi.getInvestmentInfo(requestParams);

      if (res.success) {
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
      console.error('获取投资数据失败:', error);
      message.error('获取投资数据失败').then(() => {});
      setTableData([]);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <PageContainer title={false} className="investment-page">
      <div className="investment-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            投资理财管理
          </Title>
          <Text type="secondary">记录投资买卖，追踪收益情况</Text>
        </div>
        <Space>
          <Radio.Group
            value={directionFilter}
            onChange={handleDirectionFilterChange}
            options={[
              { label: '全部', value: 'all' },
              { label: '买入', value: 'buy' },
              { label: '卖出', value: 'sell' },
            ]}
            optionType="button"
            buttonStyle="solid"
          />
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            value={dateRangeInput}
            onChange={(dates) => setDateRangeInput(dates)}
            placeholder={['开始时间', '结束时间']}
            style={{ width: 360 }}
          />
          <Button onClick={handleSearch}>查询</Button>
          <Button type="primary" onClick={handleOpenNew}>
            新增投资记录
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="investment-highlight-row">
        {statCards.map((card) => (
          <Col xs={24} md={8} key={card.key}>
            <div className={`investment-highlight-card ${card.variant}`}>
              <div className="investment-highlight-top">
                <div className="investment-highlight-icon">{card.icon}</div>
                <div className="investment-highlight-text">
                  <span className="investment-highlight-title">
                    {card.title}
                  </span>
                  <span className="investment-highlight-hint">{card.hint}</span>
                </div>
                <span className={`investment-highlight-pill ${card.pillType}`}>
                  {card.pillText}
                </span>
              </div>
              <div className="investment-highlight-value">
                {formatCurrency(card.value)}
              </div>
              <div className="investment-highlight-footer">
                <span className="investment-highlight-footer-label">
                  {card.footerLabel}
                </span>
                <span className="investment-highlight-footer-value">
                  {card.footerValue}
                </span>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} md={10}>
          <ProCard title="投资类型占比" bordered>
            <ReactECharts
              option={pieOption}
              style={{ height: 360 }}
              notMerge
              lazyUpdate
            />
          </ProCard>
        </Col>
        <Col xs={24} md={14}>
          <ProCard title="资金流动趋势" bordered>
            <ReactECharts
              option={lineOption}
              style={{ height: 360 }}
              notMerge
              lazyUpdate
            />
          </ProCard>
        </Col>
      </Row>

      <ProCard title="投资记录" bordered style={{ marginTop: 8 }}>
        <ProTable
          actionRef={actionRef}
          rowKey="id"
          search={false}
          options={false}
          pagination={{
            pageSize: 8,
          }}
          request={fetchInvestmentData}
          columns={columns}
          params={{
            dateRange,
            directionFilter,
          }}
          manualRequest={false}
        />
      </ProCard>

      <Modal
        title={editing ? '编辑投资记录' : '新增投资记录'}
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
          initialValues={editing || { direction: 'buy', date: new Date() }}
          submitter={{
            searchConfig: { submitText: editing ? '保存' : '新增' },
          }}
        >
          <ProFormRadio.Group
            name="direction"
            label="方向"
            options={directionOptions}
            rules={[{ required: true, message: '请选择方向' }]}
          />
          <ProFormSelect
            name="type"
            label="投资类型"
            placeholder="请选择投资类型"
            options={investmentTypeOptions}
            rules={[{ required: true, message: '请选择投资类型' }]}
          />
          <ProFormDigit
            name="quantity"
            label="数量"
            min={0}
            rules={[{ required: true, message: '请输入数量' }]}
          />
          <ProFormDigit
            name="price"
            label="单价"
            min={0}
            fieldProps={{ precision: 2, style: { width: '100%' } }}
            rules={[{ required: true, message: '请输入单价' }]}
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
            placeholder="可填写交易备注"
            fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
          />
        </ProForm>
      </Modal>
    </PageContainer>
  );
};

export default withAuth(Invest);
