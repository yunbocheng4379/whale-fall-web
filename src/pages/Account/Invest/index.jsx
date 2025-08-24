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
  StatisticCard
} from '@ant-design/pro-components';
import { Button, Col, message, Modal, Row, Segmented, Space, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import ReactECharts from 'echarts-for-react';
import './index.less';

const { Text, Title } = Typography;

const STORAGE_KEY = 'investment_records_v1';

const investmentTypes = ['基金','股票','债券','黄金','外汇','其他'];
const directionOptions = [
  { label: '买入', value: 'buy' },
  { label: '卖出', value: 'sell' },
];

function loadRecords() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveRecords(records) { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-CN',{ style:'currency', currency:'CNY', minimumFractionDigits:2 }).format(amount || 0);
}

const Invest = () => {
  const [records, setRecords] = useState(() => loadRecords());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const formRef = useRef();

  useEffect(() => { saveRecords(records); }, [records]);

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 160,
      align: 'center',
      sorter: true,
      render: (_, r) => moment(r.date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 80,
      align: 'center',
      valueEnum: {
        buy: { text: '买入' },
        sell: { text: '卖出' },
      },
      render: (_, r) =>
        r.direction === 'buy' ? (
          <Tag color="green">买入</Tag>
        ) : (
          <Tag color="red">卖出</Tag>
        ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      align: 'center',
      filters: true,
      valueEnum: investmentTypes.reduce((acc, t) => ({ ...acc, [t]: { text: t } }), {}),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      align: 'center',
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
      dataIndex: 'note',
      ellipsis: true,
      align: 'center',
    },
    {
      title: '操作',
      width: 160,
      valueType: 'option',
      align: 'center',
      render: (_, r) => [
        <Button type="link" key="edit" onClick={() => handleEdit(r)}>编辑</Button>,
        <Button type="link" key="del" danger onClick={() => handleDelete(r.id)}>删除</Button>,
      ],
    },
  ];

  const stats = useMemo(() => {
    const totalInvested = records
      .filter(r => r.direction === 'buy')
      .reduce((s,r)=>s+Number(r.amount||0),0);
    const totalSell = records
      .filter(r => r.direction === 'sell')
      .reduce((s,r)=>s+Number(r.amount||0),0);
    const balance = totalSell - totalInvested;
    return { totalInvested, totalSell, balance };
  }, [records]);

  const typeAgg = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      map.set(r.type, (map.get(r.type)||0) + Number(r.amount||0));
    });
    return Array.from(map.entries()).map(([k,v])=>({ name:k, value:v }));
  }, [records]);

  const trendAgg = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      const key = moment(r.date).format('MM-DD');
      map.set(key, (map.get(key)||0) + (r.direction==='buy'?-1:1)*Number(r.amount||0));
    });
    const days = Array.from(map.keys()).sort();
    return { days, values: days.map(d=>Number(map.get(d)||0)) };
  }, [records]);

  const pieOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      name: '投资类型占比', type: 'pie', radius: ['50%','75%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: typeAgg,
    }],
  }), [typeAgg]);

  const lineOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: trendAgg.days, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: trendAgg.values, smooth: true, areaStyle: {}, symbol: 'circle' }],
  }), [trendAgg]);

  const handleOpenNew = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (record) => { setEditing(record); setModalOpen(true); };
  const handleDelete = (id) => {
    Modal.confirm({
      title:'删除记录',
      content:'确认删除该条投资记录吗？',
      onOk:()=>{ setRecords(prev=>prev.filter(r=>r.id!==id)); message.success('已删除'); }
    });
  };

  const handleSubmit = async (values) => {
    const payload = {
      id: editing?.id || Date.now(),
      direction: values.direction,
      type: values.type,
      quantity: Number(values.quantity||0),
      price: Number(values.price||0),
      amount: Number(values.quantity||0) * Number(values.price||0),
      date: moment(values.date).toISOString(),
      note: values.note || '',
    };
    if (editing) {
      setRecords(prev=>prev.map(r=>r.id===editing.id?payload:r));
      message.success('已更新');
    } else {
      setRecords(prev=>[payload, ...prev]);
      message.success('已新增');
    }
    setModalOpen(false);
    setEditing(null);
    return true;
  };

  return (
    <PageContainer title={false} className="investment-page">
      <div className="investment-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>投资理财管理</Title>
          <Text type="secondary">记录投资买卖，追踪收益情况</Text>
        </div>
        <Space>
          <Button type="primary" onClick={handleOpenNew}>新增投资记录</Button>
        </Space>
      </div>

      <Row gutter={[16,16]}>
        <Col xs={24} md={8}>
          <StatisticCard
            className="investment-stat"
            statistic={{ title: '累计买入', value: formatCurrency(stats.totalInvested) }}
            chart={<div className="investment-stat-bg buy" />}
          />
        </Col>
        <Col xs={24} md={8}>
          <StatisticCard
            className="investment-stat"
            statistic={{ title: '累计卖出', value: formatCurrency(stats.totalSell) }}
            chart={<div className="investment-stat-bg sell" />}
          />
        </Col>
        <Col xs={24} md={8}>
          <StatisticCard
            className="investment-stat"
            statistic={{ title: '投资收益', value: formatCurrency(stats.balance) }}
            chart={<div className={stats.balance>=0? 'investment-stat-bg positive':'investment-stat-bg negative'} />}
          />
        </Col>
      </Row>

      <Row gutter={[16,16]} style={{ marginTop: 8 }}>
        <Col xs={24} md={10}>
          <ProCard title="投资类型占比" bordered>
            <ReactECharts option={pieOption} style={{ height: 360 }} notMerge lazyUpdate />
          </ProCard>
        </Col>
        <Col xs={24} md={14}>
          <ProCard title="资金流动趋势" bordered>
            <ReactECharts option={lineOption} style={{ height: 360 }} notMerge lazyUpdate />
          </ProCard>
        </Col>
      </Row>

      <ProCard title="投资记录" bordered style={{ marginTop: 8 }}>
        <ProTable
          rowKey="id"
          search={false}
          options={false}
          pagination={{ pageSize: 8 }}
          dataSource={records}
          columns={columns}
        />
      </ProCard>

      <Modal
        title={editing?'编辑投资记录':'新增投资记录'}
        open={modalOpen}
        onCancel={()=>{ setModalOpen(false); setEditing(null); }}
        footer={null}
        destroyOnClose
      >
        <ProForm
          formRef={formRef}
          onFinish={handleSubmit}
          initialValues={editing || { direction: 'buy', date: new Date() }}
          submitter={{ searchConfig: { submitText: editing?'保存':'新增' } }}
        >
          <ProFormRadio.Group name="direction" label="方向" options={directionOptions} rules={[{ required:true, message:'请选择方向' }]} />
          <ProFormSelect name="type" label="投资类型" placeholder="请选择投资类型" options={investmentTypes.map(t=>({label:t,value:t}))} rules={[{ required:true, message:'请选择投资类型' }]} />
          <ProFormDigit name="quantity" label="数量" min={0} rules={[{ required:true, message:'请输入数量' }]} />
          <ProFormDigit name="price" label="单价" min={0} fieldProps={{ precision:2, style:{ width:'100%' } }} rules={[{ required:true, message:'请输入单价' }]} />
          <ProFormDateTimePicker name="date" label="日期" fieldProps={{ style:{ width:'100%' } }} rules={[{ required:true, message:'请选择日期' }]} />
          <ProFormTextArea name="note" label="备注" placeholder="可填写交易备注" fieldProps={{ autoSize:{ minRows:2, maxRows:4 } }} />
        </ProForm>
      </Modal>
    </PageContainer>
  );
};

export default withAuth(Invest);
