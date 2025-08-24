import { withAuth } from '@/components/Auth';
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components';
import { Button, Col, DatePicker, Row, Select, Space, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import './index.less';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;

const StatisticsPage = () => {
  const [dateRange, setDateRange] = useState([]);
  const [expenseType, setExpenseType] = useState('all');
  const [investmentType, setInvestmentType] = useState('all');

  // 模拟数据
  const incomeExpenseData = useMemo(
    () => ({
      days: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
      income: Array.from({ length: 30 }, () =>
        Math.floor(Math.random() * 2000),
      ),
      expense: Array.from({ length: 30 }, () =>
        Math.floor(Math.random() * 1500),
      ),
    }),
    [],
  );

  const allExpenseData = useMemo(
    () => [
      { value: 1200, name: '餐饮' },
      { value: 800, name: '交通' },
      { value: 600, name: '购物' },
      { value: 400, name: '娱乐' },
      { value: 300, name: '其他' },
    ],
    [],
  );

  const allInvestmentData = useMemo(
    () => ({
      categories: ['基金', '股票', '债券', '黄金', '外汇'],
      buy: [5000, 8000, 3000, 2000, 1000],
      sell: [2000, 6000, 1000, 3000, 500],
    }),
    [],
  );

  const profitData = useMemo(
    () => ({
      months: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
      values: Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 3000),
      ),
    }),
    [],
  );

  // 收支趋势折线图配置
  const incomeExpenseOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { data: ['收入', '支出'] },
      xAxis: { type: 'category', data: incomeExpenseData.days },
      yAxis: { type: 'value' },
      series: [
        {
          name: '收入',
          type: 'line',
          smooth: true,
          data: incomeExpenseData.income,
        },
        {
          name: '支出',
          type: 'line',
          smooth: true,
          data: incomeExpenseData.expense,
        },
      ],
    }),
    [incomeExpenseData],
  );

  // 消费分类占比
  const expenseCategoryOption = useMemo(
    () => ({
      tooltip: { trigger: 'item' },
      legend: { top: '5%' },
      series: [
        {
          name: '消费分类',
          type: 'pie',
          radius: ['40%', '70%'],
          data:
            expenseType === 'all'
              ? allExpenseData
              : allExpenseData.filter((item) => item.name === expenseType),
        },
      ],
    }),
    [allExpenseData, expenseType],
  );

  // 理财投资柱状图
  const investmentOption = useMemo(() => {
    const filteredCategories =
      investmentType === 'all'
        ? allInvestmentData.categories
        : [investmentType];
    const filteredBuy =
      investmentType === 'all'
        ? allInvestmentData.buy
        : [
            allInvestmentData.buy[
              allInvestmentData.categories.indexOf(investmentType)
            ],
          ];
    const filteredSell =
      investmentType === 'all'
        ? allInvestmentData.sell
        : [
            allInvestmentData.sell[
              allInvestmentData.categories.indexOf(investmentType)
            ],
          ];

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['买入', '卖出'] },
      xAxis: { type: 'category', data: filteredCategories },
      yAxis: { type: 'value' },
      series: [
        { name: '买入', type: 'bar', data: filteredBuy },
        { name: '卖出', type: 'bar', data: filteredSell },
      ],
    };
  }, [allInvestmentData, investmentType]);

  // 理财收益趋势
  const profitOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { data: ['收益'] },
      xAxis: { type: 'category', data: profitData.months },
      yAxis: { type: 'value' },
      series: [
        {
          name: '收益',
          type: 'line',
          smooth: true,
          areaStyle: {},
          data: profitData.values,
        },
      ],
    }),
    [profitData],
  );

  return (
    <PageContainer title={false} className="statistics-page">
      <div className="ledger-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            账单统计
          </Title>
          <Text type="secondary">记录个人支出、收入以及理财管理等</Text>
        </div>
      </div>
      {/* 筛选区域 */}
      <ProCard bordered className="filter-card" style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker onChange={(dates) => setDateRange(dates)} />
          <Select
            value={expenseType}
            style={{ width: 150 }}
            onChange={setExpenseType}
          >
            <Option value="all">全部消费</Option>
            <Option value="餐饮">餐饮</Option>
            <Option value="交通">交通</Option>
            <Option value="购物">购物</Option>
            <Option value="娱乐">娱乐</Option>
            <Option value="其他">其他</Option>
          </Select>
          <Select
            value={investmentType}
            style={{ width: 150 }}
            onChange={setInvestmentType}
          >
            <Option value="all">全部理财</Option>
            <Option value="基金">基金</Option>
            <Option value="股票">股票</Option>
            <Option value="债券">债券</Option>
            <Option value="黄金">黄金</Option>
            <Option value="外汇">外汇</Option>
          </Select>
          <Button type="primary">查询</Button>
        </Space>
      </ProCard>

      {/* 顶部统计卡 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <StatisticCard
            statistic={{ title: '本月收入', value: 12800, prefix: '¥' }}
          />
        </Col>
        <Col xs={24} md={6}>
          <StatisticCard
            statistic={{ title: '本月支出', value: 9400, prefix: '¥' }}
          />
        </Col>
        <Col xs={24} md={6}>
          <StatisticCard
            statistic={{ title: '结余', value: 3400, prefix: '¥' }}
          />
        </Col>
        <Col xs={24} md={6}>
          <StatisticCard
            statistic={{ title: '理财收益', value: 2200, prefix: '¥' }}
          />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <ProCard title="收支趋势" bordered>
            <ReactECharts
              option={incomeExpenseOption}
              style={{ height: 300 }}
            />
          </ProCard>
        </Col>
        <Col xs={24} md={12}>
          <ProCard title="消费分类占比" bordered>
            <ReactECharts
              option={expenseCategoryOption}
              style={{ height: 300 }}
            />
          </ProCard>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <ProCard title="理财投资情况" bordered>
            <ReactECharts option={investmentOption} style={{ height: 300 }} />
          </ProCard>
        </Col>
        <Col xs={24} md={12}>
          <ProCard title="理财收益趋势" bordered>
            <ReactECharts option={profitOption} style={{ height: 300 }} />
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default withAuth(StatisticsPage);
