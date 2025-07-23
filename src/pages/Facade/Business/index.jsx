import WhaleApi from '@/api/WhaleApi';
import { withAuth } from '@/components/Auth';
import {
  PageContainer,
  ProCard,
  StatisticCard,
  GridContent
} from '@ant-design/pro-components';
import {
  Button,
  Row,
  Col,
  Typography,
  Space,
  Card,
  Progress
} from 'antd';
import {
  HeartOutlined,
  CalendarOutlined,
  CameraOutlined,
  GiftOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  TransactionOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import './index.less';

const { Title, Text } = Typography;

// 数字动画组件
const AnimatedNumber = ({ value, duration = 2000, suffix = '', prefix = '' }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCurrent(end);
        clearInterval(timer);
      } else {
        setCurrent(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{prefix}{current.toLocaleString()}{suffix}</span>;
};

const HomePage = () => {
  const handleStartRecord = () => {
    WhaleApi.queryWhale({ id: 1 });
  };

  // 访问记录图表配置
  const visitOption = {
    title: {
      text: '访问趋势',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      textStyle: { color: '#666' }
    },
    grid: { top: 60, right: 30, bottom: 30, left: 30 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f5f5f5' } }
    },
    series: [{
      data: [120, 200, 150, 80, 70, 110],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#1890ff' },
      itemStyle: { color: '#1890ff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ]
        }
      }
    }]
  };

  // 消费类型饼图配置
  const expenseTypeOption = {
    title: {
      text: '消费类型分布',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 10,
      left: 'center'
    },
    series: [{
      name: '消费类型',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: [
        { value: 1048, name: '饮食', itemStyle: { color: '#5470c6' } },
        { value: 735, name: '交通', itemStyle: { color: '#91cc75' } },
        { value: 580, name: '购物', itemStyle: { color: '#fac858' } },
        { value: 484, name: '娱乐', itemStyle: { color: '#ee6666' } },
        { value: 300, name: '其他', itemStyle: { color: '#73c0de' } }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  // 收支对比图表配置
  const incomeExpenseOption = {
    title: {
      text: '收支对比',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['收入', '支出'],
      top: 30,
      textStyle: { fontSize: 12 }
    },
    grid: { top: 60, right: 30, bottom: 30, left: 30 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f5f5f5' } }
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: [2000, 2200, 1900, 2100, 1700, 2300],
        itemStyle: {
          color: '#52c41a',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '支出',
        type: 'bar',
        data: [1800, 1900, 1600, 1800, 1500, 2000],
        itemStyle: {
          color: '#ff4d4f',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  return (
    <PageContainer title={false} className="couple-dashboard">
      <div className="dashboard-container">
        {/* 今日消费概览 */}
        <ProCard className="today-overview" title="今日消费" headerBordered>
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <div className="overview-item">
                <div className="overview-icon expense">
                  <FallOutlined />
                </div>
                <div className="overview-content">
                  <div className="overview-value">
                    <AnimatedNumber value={1234} prefix="¥" />
                  </div>
                  <div className="overview-label">总消费额</div>
                  <div className="overview-trend down">
                    较昨日 -12%
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="overview-item">
                <div className="overview-icon count">
                  <TransactionOutlined />
                </div>
                <div className="overview-content">
                  <div className="overview-value">
                    <AnimatedNumber value={23} />
                  </div>
                  <div className="overview-label">消费笔数</div>
                  <div className="overview-trend up">
                    较昨日 +8%
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="overview-item">
                <div className="overview-icon income">
                  <RiseOutlined />
                </div>
                <div className="overview-content">
                  <div className="overview-value">
                    <AnimatedNumber value={2580} prefix="¥" />
                  </div>
                  <div className="overview-label">总收入额</div>
                  <div className="overview-trend up">
                    较昨日 +15%
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="overview-item">
                <div className="overview-icon count">
                  <DollarOutlined />
                </div>
                <div className="overview-content">
                  <div className="overview-value">
                    <AnimatedNumber value={8} />
                  </div>
                  <div className="overview-label">收入笔数</div>
                  <div className="overview-trend up">
                    较昨日 +2%
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </ProCard>

        {/* 核心指标 */}
        <Row gutter={[24, 24]} className="metrics-row">
          <Col xs={24} sm={12} lg={6}>
            <ProCard className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">
                    <AnimatedNumber value={365} suffix="天" />
                  </div>
                  <div className="metric-label">甜蜜时光</div>
                  <Progress
                    percent={75}
                    showInfo={false}
                    strokeColor="#1890ff"
                    size="small"
                  />
                </div>
              </div>
            </ProCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ProCard className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <CameraOutlined style={{ color: '#52c41a' }} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">
                    <AnimatedNumber value={128} suffix="张" />
                  </div>
                  <div className="metric-label">美好回忆</div>
                  <Progress
                    percent={64}
                    showInfo={false}
                    strokeColor="#52c41a"
                    size="small"
                  />
                </div>
              </div>
            </ProCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ProCard className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <GiftOutlined style={{ color: '#faad14' }} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">
                    <AnimatedNumber value={24} suffix="份" />
                  </div>
                  <div className="metric-label">惊喜礼物</div>
                  <Progress
                    percent={48}
                    showInfo={false}
                    strokeColor="#faad14"
                    size="small"
                  />
                </div>
              </div>
            </ProCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ProCard className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <StarOutlined style={{ color: '#f5222d' }} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">
                    <AnimatedNumber value={99.9} suffix="%" />
                  </div>
                  <div className="metric-label">幸福指数</div>
                  <Progress
                    percent={99.9}
                    showInfo={false}
                    strokeColor="#f5222d"
                    size="small"
                  />
                </div>
              </div>
            </ProCard>
          </Col>
        </Row>

        {/* 数据图表 */}
        <Row gutter={[24, 24]} className="charts-row">
          <Col xs={24} lg={8}>
            <ProCard className="chart-card">
              <ReactECharts option={visitOption} style={{ height: '320px' }} />
            </ProCard>
          </Col>
          <Col xs={24} lg={8}>
            <ProCard className="chart-card">
              <ReactECharts option={expenseTypeOption} style={{ height: '320px' }} />
            </ProCard>
          </Col>
          <Col xs={24} lg={8}>
            <ProCard className="chart-card">
              <ReactECharts option={incomeExpenseOption} style={{ height: '320px' }} />
            </ProCard>
          </Col>
        </Row>

        {/* 快捷操作 */}
        <ProCard title="快捷操作" className="action-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card hoverable className="action-item">
                <CameraOutlined className="action-icon" />
                <div className="action-text">上传照片</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable className="action-item">
                <CalendarOutlined className="action-icon" />
                <div className="action-text">记录日程</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable className="action-item">
                <GiftOutlined className="action-icon" />
                <div className="action-text">惊喜提醒</div>
              </Card>
            </Col>
          </Row>
        </ProCard>
      </div>
    </PageContainer>
  );
};

export default withAuth(HomePage);
