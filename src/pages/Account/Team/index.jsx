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
import { Button, Col, Modal, Row, Segmented, Select, Space, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import ReactECharts from 'echarts-for-react';
import './index.less';

const { Text, Title } = Typography;

const STORAGE_KEY = 'couple_ledger_records_v1';

const defaultCategories = {
  expense: ['旅游','购物','餐饮','娱乐','礼物','节日','其他'],
  income: ['工资','奖金','红包','转账','理财','其他'],
};

const typeOptions = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' },
];

const quickRanges = [
  { label: '今天', value: 'today' },
  { label: '本月', value: 'thisMonth' },
  { label: '上月', value: 'lastMonth' },
  { label: '近7天', value: 'last7' },
  { label: '今年', value: 'thisYear' },
];

function loadRecords() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveRecords(records) { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function getQuickRange(value) {
  const now = moment();
  switch(value){
    case 'today': return [now.clone().startOf('day'), now.clone().endOf('day')];
    case 'thisMonth': return [now.clone().startOf('month'), now.clone().endOf('month')];
    case 'lastMonth': { const last = now.clone().subtract(1,'month'); return [last.startOf('month'), last.endOf('month')]; }
    case 'last7': return [now.clone().subtract(6,'day').startOf('day'), now.clone().endOf('day')];
    case 'thisYear': return [now.clone().startOf('year'), now.clone().endOf('year')];
    default: return [now.clone().startOf('month'), now.clone().endOf('month')];
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-CN',{ style:'currency', currency:'CNY', minimumFractionDigits:2 }).format(amount||0);
}

const Team = () => {
  const [records, setRecords] = useState(() => loadRecords());
  const [range, setRange] = useState(() => getQuickRange('today'));
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [quick, setQuick] = useState('today');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const formRef = useRef();

  useEffect(() => { saveRecords(records); }, [records]);

  const columns = [
    { title:'日期', dataIndex:'date', width:160, align:'center', render: (_,r)=>moment(r.date).format('YYYY-MM-DD HH:mm') },
    { title:'类型', dataIndex:'type', width:80, align:'center', render:(_,r)=> r.type==='expense'?<Tag color="red">支出</Tag>:<Tag color="green">收入</Tag> },
    { title:'分类', dataIndex:'category', width:100, align:'center' },
    { title:'金额', dataIndex:'amount', width:120, align:'center', render:(_,r)=><span className={r.type==='expense'?'ledger-minus':'ledger-plus'}>{r.amount.toLocaleString()}</span> },
    { title:'备注', dataIndex:'note', ellipsis:true, align:'center' },
    { title:'操作', width:160, align:'center', valueType:'option', render:(_,r)=>[
        <Button type="link" key="edit" onClick={()=>handleEdit(r)}>编辑</Button>,
        <Button type="link" key="del" danger onClick={()=>handleDelete(r.id)}>删除</Button>
      ]},
  ];

  const filtered = useMemo(()=>{
    const [start,end] = range;
    return records.filter(r=>{
      const d = moment(r.date);
      const inRange = (!start || d.isSameOrAfter(start)) && (!end || d.isSameOrBefore(end));
      const typeOk = type ? r.type===type : true;
      const catOk = category ? r.category===category : true;
      return inRange && typeOk && catOk;
    }).sort((a,b)=>moment(b.date).valueOf() - moment(a.date).valueOf());
  }, [records, range, type, category]);

  const stats = useMemo(()=>{
    const income = filtered.filter(r=>r.type==='income').reduce((s,r)=>s+Number(r.amount||0),0);
    const expense = filtered.filter(r=>r.type==='expense').reduce((s,r)=>s+Number(r.amount||0),0);
    return { income, expense, balance: income-expense };
  }, [filtered]);

  const categoryAgg = useMemo(()=>{
    const map = new Map();
    filtered.forEach(r=>{ const k = `${r.type}-${r.category||'未分类'}`; map.set(k,(map.get(k)||0)+Number(r.amount||0)); });
    return Array.from(map.entries()).filter(([k])=>k.startsWith(type)).map(([k,v])=>({ name:k.split('-')[1], value:v })).sort((a,b)=>b.value-a.value);
  }, [filtered, type]);

  const trendAgg = useMemo(()=>{
    const map = new Map();
    filtered.forEach(r=>{ const key = moment(r.date).format('MM-DD'); map.set(key,(map.get(key)||0)+(r.type==='expense'?-1:1)*Number(r.amount||0)); });
    const days = Array.from(map.keys()).sort();
    return { days, values: days.map(d=>Number(map.get(d)||0)) };
  }, [filtered]);

  const donutOption = useMemo(()=>({
    tooltip:{ trigger:'item', formatter:'{b}: {c} ({d}%)' },
    legend:{ bottom:0 },
    series:[{ name:type==='expense'?'支出':'收入', type:'pie', radius:['56%','80%'],
      itemStyle:{ borderRadius:10, borderColor:'#fff', borderWidth:2 },
      label:{ show:true, formatter:'{b}\n{d}%' },
      data: categoryAgg
    }]
  }), [categoryAgg, type]);

  const lineOption = useMemo(()=>({
    tooltip:{ trigger:'axis' },
    grid:{ left:40,right:16,top:30,bottom:40 },
    xAxis:{ type:'category', data:trendAgg.days, boundaryGap:false, axisTick:{ show:false } },
    yAxis:{ type:'value' },
    series:[{ type:'line', data:trendAgg.values, smooth:true, areaStyle:{}, symbol:'circle' }]
  }), [trendAgg]);

  const handleOpenNew = ()=>{ setEditing(null); setModalOpen(true); };
  const handleEdit = (record)=>{ setEditing(record); setModalOpen(true); };
  const handleDelete = (id)=>{ Modal.confirm({ title:'删除记录', content:'确认删除该条记录吗？', onOk:()=>{ setRecords(prev=>prev.filter(r=>r.id!==id)); } }); };

  const handleSubmit = async (values)=>{
    const m = values.date && typeof values.date?.toDate==='function'? moment(values.date.toDate()):moment(values.date||undefined);
    const payload = { id: editing?.id || Date.now(), type: values.type, category: values.category, amount:Number(values.amount||0), date:m.isValid()?m.toISOString():moment().toISOString(), note:values.note||'' };
    if(editing){ setRecords(prev=>prev.map(r=>r.id===editing.id?payload:r)); } else { setRecords(prev=>[payload,...prev]); }
    setModalOpen(false); setEditing(null); return true;
  };

  const categoryOptions = useMemo(()=>{
    const list = type==='expense'? defaultCategories.expense : defaultCategories.income;
    return list.map(c=>({ label:c, value:c }));
  }, [type]);

  const fetchLedgerData = async (params)=>{ // mock 后端
    return new Promise(resolve=>{ setTimeout(()=>{
      const data = new Array(params.pageSize||10).fill(0).map((_,i)=>({ id:(params.current-1)*(params.pageSize||10)+i+1, date:new Date(Date.now()-i*3600*1000), type:i%2===0?'expense':'income', category:['旅游','购物','餐饮','工资'][i%4], amount:Math.round(Math.random()*100)+20, note:'测试数据'+i }));
      resolve({ data, success:true, total:25 });
    },500); });
  };

  return (
    <PageContainer title={false} className="ledger-page">
      <div className="ledger-header">
        <div>
          <Title level={3} style={{ margin:0 }}>情侣共同记账</Title>
          <Text type="secondary">记录两人共同花销，如旅游、购物、聚餐等</Text>
        </div>
        <Space>
          <Segmented
            options={[{label:'支出', value:'expense'},{label:'收入', value:'income'}]}
            value={type}
            onChange={setType}
          />
          <Select
            value={quick}
            onChange={(v)=>{ setQuick(v); setRange(getQuickRange(v)); }}
            options={quickRanges}
            style={{ width: 120 }}
          />
          <Select
            allowClear
            placeholder="分类"
            value={category || undefined}
            onChange={(v)=>setCategory(v||'')}
            options={categoryOptions}
            style={{ width: 140 }}
          />
          <Button type="primary" onClick={handleOpenNew}>新增记录</Button>
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
              rowKey="id" 
              search={false} 
              options={false} 
              pagination={{ pageSize: 8 }} 
              request={fetchLedgerData} 
              columns={columns} 
            />
          </ProCard>
        </Col>
      </Row>

      <Modal title={editing?'编辑记录':'新增记录'} open={modalOpen} onCancel={()=>{ setModalOpen(false); setEditing(null); }} footer={null} destroyOnClose>
        <ProForm formRef={formRef} onFinish={handleSubmit} initialValues={editing || { type, date: new Date() }} submitter={{ searchConfig:{ submitText: editing?'保存':'新增' } }}>
          <ProFormRadio.Group name="type" label="类型" options={typeOptions} rules={[{ required:true, message:'请选择类型' }]} fieldProps={{ onChange: ()=> formRef.current?.setFieldValue('category', undefined) }} />
          <ProFormSelect name="category" label="分类" placeholder="请选择分类" options={categoryOptions} rules={[{ required:true, message:'请选择分类' }]} />
          <ProFormDigit name="amount" label="金额" min={0} fieldProps={{ precision:2, style:{ width:'100%' } }} rules={[{ required:true, message:'请输入金额' }]} />
          <ProFormDateTimePicker name="date" label="日期" fieldProps={{ style:{ width:'100%' } }} rules={[{ required:true, message:'请选择日期' }]} />
          <ProFormTextArea name="note" label="备注" placeholder="可填写商家、项目等" fieldProps={{ autoSize:{ minRows:2, maxRows:4 } }} />
        </ProForm>
      </Modal>
    </PageContainer>
  );
};

export default withAuth(Team);
