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

  // 存储目标 vs 实际存储图表配置
  const incomeExpenseOption = {
    title: {
      text: '存储目标 vs 实际存储',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      textStyle: { color: '#666' }
    },
    legend: {
      data: ['目标存储', '实际存储'],
      top: 35,
      textStyle: { fontSize: 12, color: '#666' },
      itemWidth: 14,
      itemHeight: 14
    },
    grid: {
      top: 70,
      right: 30,
      bottom: 30,
      left: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: {
        lineStyle: { color: '#e8e8e8' }
      },
      axisTick: { show: false },
      axisLabel: {
        color: '#666',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 12
      },
      max: 2500
    },
    series: [
      {
        name: '目标存储',
        type: 'bar',
        data: [2000, 2000, 2000, 2000, 2000, 2000],
        itemStyle: {
          color: '#4ECDC4', // 青绿色，类似样例图片
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '35%'
      },
      {
        name: '实际存储',
        type: 'bar',
        data: [1800, 2200, 1900, 2100, 1700, 2300],
        itemStyle: {
          color: '#FF6B6B', // 红色，类似样例图片
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '35%'
      }
    ]
  };

  // 趋势对比折线图配置
  const trendComparisonOption = {
    backgroundColor: '#fafbfc',
    grid: {
      top: 40,
      right: 40,
      bottom: 80,
      left: 40,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      textStyle: { color: '#666', fontSize: 12 },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#ddd',
          width: 1,
          type: 'dashed'
        }
      }
    },
    legend: {
      data: ['实际值', '目标值'],
      top: 10,
      left: 'center',
      textStyle: {
        fontSize: 12,
        color: '#666'
      },
      itemWidth: 12,
      itemHeight: 8
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 10,
        height: 22,
        handleIcon: 'path://M0,0 L6,0 L6,20 L0,20 Z',
        handleSize: '100%',
        handleStyle: {
          color: '#e6e6e6',
          borderColor: '#bbb',
          borderWidth: 1,
          shadowBlur: 2,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowOffsetX: 1,
          shadowOffsetY: 1
        },
        textStyle: {
          color: '#999',
          fontSize: 10
        },
        borderColor: '#e8e8e8',
        fillerColor: 'rgba(24, 144, 255, 0.15)',
        backgroundColor: '#fafafa',
        dataBackground: {
          lineStyle: {
            color: '#e8e8e8',
            width: 1
          },
          areaStyle: {
            color: 'rgba(230, 230, 230, 0.3)'
          }
        },
        selectedDataBackground: {
          lineStyle: {
            color: '#1890ff'
          },
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.1)'
          }
        }
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100
      }
    ],
    xAxis: {
      type: 'category',
      data: ['11:24', '11:54', '12:24', '12:54', '13:24', '13:54', '14:24', '14:54', '15:24', '15:54', '16:24', '16:54', '17:24', '17:54', '18:24', '18:54', '19:24', '19:54', '20:24', '20:54'],
      axisLine: {
        lineStyle: { color: '#e8e8e8' }
      },
      axisTick: { show: false },
      axisLabel: {
        color: '#999',
        fontSize: 11,
        interval: 2
      },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 120,
      interval: 20,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#999',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          width: 1,
          type: 'solid'
        }
      }
    },
    series: [
      {
        name: '实际值',
        type: 'line',
        data: [65, 68, 70, 25, 30, 55, 50, 85, 80, 95, 75, 15, 100, 95, 20, 95, 85, 30, 75, 25],
        lineStyle: {
          color: '#4A90E2',
          width: 2
        },
        itemStyle: {
          color: '#4A90E2'
        },
        symbol: 'circle',
        symbolSize: 4,
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(74, 144, 226, 0.1)' },
              { offset: 1, color: 'rgba(74, 144, 226, 0.02)' }
            ]
          }
        }
      },
      {
        name: '目标值',
        type: 'line',
        data: [50, 60, 65, 70, 25, 90, 20, 50, 25, 85, 70, 15, 85, 100, 95, 35, 85, 45, 105, 15],
        lineStyle: {
          color: '#4ECDC4',
          width: 2
        },
        itemStyle: {
          color: '#4ECDC4'
        },
        symbol: 'circle',
        symbolSize: 4,
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(78, 205, 196, 0.1)' },
              { offset: 1, color: 'rgba(78, 205, 196, 0.02)' }
            ]
          }
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
              <ReactECharts option={visitOption} style={{ height: '430px' }} />
            </ProCard>
          </Col>
          <Col xs={24} lg={8}>
            <ProCard className="chart-card">
              <ReactECharts option={expenseTypeOption} style={{ height: '430px' }} />
            </ProCard>
          </Col>
          <Col xs={24} lg={8}>
            <ProCard className="chart-card">
              <ReactECharts option={incomeExpenseOption} style={{ height: '320px' }} />

              {/* 存储统计总结 */}
              <Row gutter={16} style={{ marginTop: '16px' }}>
                <Col span={12}>
                  <div className="storage-summary-item">
                    <div className="summary-icon" style={{ backgroundColor: '#E8F8F7' }}>
                      <span style={{ color: '#4ECDC4', fontSize: '16px' }}>🔒</span>
                    </div>
                    <div className="summary-content">
                      <div className="summary-label" style={{ color: '#999', fontSize: '12px' }}>
                        实际销售额
                      </div>
                      <div className="summary-sub-label" style={{ color: '#999', fontSize: '11px' }}>
                        全球
                      </div>
                      <div className="summary-value" style={{ color: '#4ECDC4', fontSize: '18px', fontWeight: 'bold' }}>
                        <AnimatedNumber value={8823} />
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="storage-summary-item">
                    <div className="summary-icon" style={{ backgroundColor: '#FFF0F0' }}>
                      <span style={{ color: '#FF6B6B', fontSize: '16px' }}>💰</span>
                    </div>
                    <div className="summary-content">
                      <div className="summary-label" style={{ color: '#999', fontSize: '12px' }}>
                        目标销售额
                      </div>
                      <div className="summary-sub-label" style={{ color: '#999', fontSize: '11px' }}>
                        商业
                      </div>
                      <div className="summary-value" style={{ color: '#FF6B6B', fontSize: '18px', fontWeight: 'bold' }}>
                        <AnimatedNumber value={12122} />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </ProCard>
          </Col>
        </Row>

        {/* 趋势对比折线图 */}
        <Row gutter={[24, 24]} className="trend-chart-row">
          <Col xs={24}>
            <ProCard className="chart-card trend-chart-card">
              <ReactECharts option={trendComparisonOption} style={{ height: '350px' }} />
            </ProCard>
          </Col>
        </Row>

        {/* 关于项目 */}
        <Row gutter={[24, 24]} className="about-project-row">
          <Col xs={24}>
            <ProCard className="about-project-card" title="关于项目" headerBordered>
              <Row gutter={[32, 24]} align="middle">
                <Col xs={24} md={14}>
                  <div className="project-info-grid">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <div className="project-info-item">
                          <div className="info-label">项目简介</div>
                          <div className="info-content">
                            Ant Design Pro 是一个企业级中后台前端/设计解决方案，我们秉承 Ant Design 的设计价值观，致力于在设计规范和基础组件的基础上，继续向上构建，提炼出典型模板/业务组件/配套设计资源，进一步提升企业级中后台产品的用户和设计开发体验。
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="project-info-item">
                          <div className="info-label">文档</div>
                          <div className="info-content">
                            完整的开发文档和组件说明，帮助开发者快速上手项目开发。包含详细的API说明、最佳实践指南和常见问题解答。
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="project-info-item">
                          <div className="info-label">Github</div>
                          <div className="info-content">
                            开源项目托管在Github上，欢迎Star和Fork。我们鼓励社区贡献，共同完善这个企业级解决方案。
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="project-info-item">
                          <div className="info-label">博客</div>
                          <div className="info-content">
                            定期更新技术博客，分享最新的开发经验、设计理念和技术趋势。帮助开发者了解前沿技术动态。
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col xs={24} md={10}>
                  <div className="project-image-container">
                    <img
                      src="/img/system/description.png"
                      alt="项目介绍"
                      className="project-description-image"
                    />
                  </div>
                </Col>
              </Row>
            </ProCard>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default withAuth(HomePage);
