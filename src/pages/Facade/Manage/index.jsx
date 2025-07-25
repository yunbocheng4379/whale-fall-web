import React from 'react';
import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Row, Col, Progress } from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  MonitorOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  LineChartOutlined
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

const ManagePage = () => {
  // 总收入双柱状图配置
  const totalIncomeOption = {
    title: {
      text: '总收入',
      left: 'left',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#333' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      textStyle: { color: '#666' },
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(function(item) {
          result += item.marker + item.seriesName + ': ' + item.value + '万<br/>';
        });
        return result;
      }
    },
    legend: {
      data: ['线上销售', '线下销售'],
      bottom: 10,
      left: 'center',
      textStyle: { fontSize: 12, color: '#666' },
      itemWidth: 14,
      itemHeight: 14
    },
    grid: { top: 60, right: 30, bottom: 60, left: 30 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#666',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      max: 20,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f5f5f5' } },
      axisLabel: {
        color: '#666',
        fontSize: 12
      }
    },
    series: [
      {
        name: '线上销售',
        type: 'bar',
        data: [12, 13, 5, 15, 10, 15, 18],
        itemStyle: {
          color: '#5B8FF9',
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '20%',
        barGap: '10%'
      },
      {
        name: '线下销售',
        type: 'bar',
        data: [10, 11, 20, 5, 11, 13, 10],
        itemStyle: {
          color: '#5AD8A6',
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '20%'
      }
    ]
  };

  // 访问量趋势图配置
  const visitTrendOption = {
    title: {
      text: '访问量',
      left: 'left',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#333' }
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 80,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f5f5f5' } }
    },
    series: [{
      data: [50, 25, 40, 20, 70, 35, 65, 30, 35, 20, 40, 45],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#4A90E2' },
      itemStyle: { color: '#4A90E2' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(74, 144, 226, 0.3)' },
            { offset: 1, color: 'rgba(74, 144, 226, 0.05)' }
          ]
        }
      }
    }]
  };

  // 资源剩余饼图配置
  const resourceOption = {
    title: {
      text: '资源剩余',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#333' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['50%', '60%'],
      data: [
        { value: 35, name: '已使用', itemStyle: { color: '#4A90E2' } },
        { value: 65, name: '剩余', itemStyle: { color: '#E8F4FD' } }
      ],
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }],
    graphic: {
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: '35 %',
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#333'
      }
    }
  };

  // 系统效率仪表盘配置
  const efficiencyOption = {
    title: {
      text: '系统效率',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#333' }
    },
    series: [{
      type: 'gauge',
      center: ['50%', '60%'],
      startAngle: 200,
      endAngle: -40,
      min: 0,
      max: 100,
      splitNumber: 5,
      itemStyle: {
        color: '#58D9F9',
        shadowColor: 'rgba(0,138,255,0.45)',
        shadowBlur: 10,
        shadowOffsetX: 2,
        shadowOffsetY: 2
      },
      progress: {
        show: true,
        roundCap: true,
        width: 18
      },
      pointer: {
        icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
        length: '75%',
        width: 16,
        offsetCenter: [0, '5%']
      },
      axisLine: {
        roundCap: true,
        lineStyle: {
          width: 18,
          color: [[1, '#E6EBF8']]
        }
      },
      axisTick: {
        distance: -45,
        splitNumber: 5,
        lineStyle: {
          width: 2,
          color: '#999'
        }
      },
      splitLine: {
        distance: -52,
        length: 14,
        lineStyle: {
          width: 3,
          color: '#999'
        }
      },
      axisLabel: {
        distance: -20,
        color: '#999',
        fontSize: 12
      },
      title: {
        show: false
      },
      detail: {
        backgroundColor: '#fff',
        borderColor: '#999',
        borderWidth: 2,
        width: '60%',
        lineHeight: 40,
        height: 40,
        borderRadius: 8,
        offsetCenter: [0, '35%'],
        valueAnimation: true,
        formatter: function (value) {
          return '{value|' + value.toFixed(0) + '}{unit|%}';
        },
        rich: {
          value: {
            fontSize: 20,
            fontWeight: 'bolder',
            color: '#777'
          },
          unit: {
            fontSize: 14,
            color: '#999',
            padding: [0, 0, -20, 10]
          }
        }
      },
      data: [{
        value: 75,
        name: '优'
      }]
    }]
  };

  // XX指数雷达图配置
  const radarOption = {
    title: {
      text: 'XX指数',
      left: 'left',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#333' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      textStyle: { color: '#666' }
    },
    legend: {
      data: ['个人', '团队', '部门'],
      bottom: 10,
      left: 'center',
      textStyle: { fontSize: 12, color: '#666' },
      itemWidth: 14,
      itemHeight: 14
    },
    radar: {
      center: ['50%', '50%'],
      radius: '60%',
      indicator: [
        { name: '引用', max: 10 },
        { name: '口碑', max: 10 },
        { name: '产量', max: 10 },
        { name: '贡献', max: 10 },
        { name: '热度', max: 10 }
      ],
      name: {
        textStyle: {
          color: '#999',
          fontSize: 12
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [8, 7, 6, 9, 8],
          name: '个人',
          itemStyle: { color: '#5B8FF9' },
          areaStyle: { color: 'rgba(91, 143, 249, 0.3)' }
        },
        {
          value: [6, 8, 7, 5, 6],
          name: '团队',
          itemStyle: { color: '#5AD8A6' },
          areaStyle: { color: 'rgba(90, 216, 166, 0.3)' }
        },
        {
          value: [7, 6, 8, 7, 9],
          name: '部门',
          itemStyle: { color: '#FF9845' },
          areaStyle: { color: 'rgba(255, 152, 69, 0.3)' }
        }
      ]
    }]
  };

  return (
    <PageContainer title={false} className="manage-dashboard">
      <div className="dashboard-container">
        <h1>管理仪表板</h1>

        {/* 简单的统计卡片 */}
        <Row gutter={[24, 16]} className="stats-row">
          <Col xs={12} sm={6}>
            <ProCard className="stat-card">
              <div className="stat-content">
                <div className="stat-icon total-visits">
                  <EyeOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    <AnimatedNumber value={3120} />
                  </div>
                  <div className="stat-label">总访问量</div>
                  <div className="stat-trend up">较上周 +20%</div>
                </div>
              </div>
            </ProCard>
          </Col>
          <Col xs={12} sm={6}>
            <ProCard className="stat-card">
              <div className="stat-content">
                <div className="stat-icon online-users">
                  <UserOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    <AnimatedNumber value={182} />
                  </div>
                  <div className="stat-label">在线访客数</div>
                  <div className="stat-trend up">较上周 +10%</div>
                </div>
              </div>
            </ProCard>
          </Col>
          <Col xs={12} sm={6}>
            <ProCard className="stat-card">
              <div className="stat-content">
                <div className="stat-icon clicks">
                  <ThunderboltOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    <AnimatedNumber value={9520} />
                  </div>
                  <div className="stat-label">点击量</div>
                  <div className="stat-trend down">较上周 -12%</div>
                </div>
              </div>
            </ProCard>
          </Col>
          <Col xs={12} sm={6}>
            <ProCard className="stat-card">
              <div className="stat-content">
                <div className="stat-icon new-users">
                  <UserAddOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    <AnimatedNumber value={156} />
                  </div>
                  <div className="stat-label">新用户</div>
                  <div className="stat-trend up">较上周 +18%</div>
                </div>
              </div>
            </ProCard>
          </Col>
        </Row>

        {/* 图表占位符区域 */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={16}>
            <ProCard className="chart-card">
              <ReactECharts option={totalIncomeOption} style={{ height: '350px' }} />
            </ProCard>
          </Col>
          <Col xs={24} lg={8}>
            <ProCard className="chart-card">
              <ReactECharts option={visitTrendOption} style={{ height: '350px' }} />
            </ProCard>
          </Col>
        </Row>

        {/* 系统运行指标 */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <ProCard className="chart-card">
              <ReactECharts option={resourceOption} style={{ height: '280px' }} />
            </ProCard>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <ProCard className="chart-card">
              <ReactECharts option={efficiencyOption} style={{ height: '280px' }} />
            </ProCard>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <ProCard className="chart-card">
              <ReactECharts option={radarOption} style={{ height: '280px' }} />
            </ProCard>
          </Col>
        </Row>

        {/* 系统运行各项指标 */}
        <Row gutter={[24, 24]} className="detailed-metrics-row" style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <ProCard className="metrics-overview-card" title="系统运行各项指标" headerBordered>
              <Row gutter={[32, 24]}>
                <Col xs={24} sm={12} md={6}>
                  <div className="metric-item">
                    <div className="metric-icon-wrapper cpu">
                      <MonitorOutlined className="metric-icon" />
                    </div>
                    <div className="metric-details">
                      <div className="metric-title">CPU使用率</div>
                      <div className="metric-value">
                        <AnimatedNumber value={45} suffix="%" />
                      </div>
                      <Progress
                        percent={45}
                        showInfo={false}
                        strokeColor="#52c41a"
                        size="small"
                        style={{ marginTop: '8px' }}
                      />
                      <div className="metric-status normal">正常</div>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="metric-item">
                    <div className="metric-icon-wrapper memory">
                      <CloudServerOutlined className="metric-icon" />
                    </div>
                    <div className="metric-details">
                      <div className="metric-title">内存使用率</div>
                      <div className="metric-value">
                        <AnimatedNumber value={68} suffix="%" />
                      </div>
                      <Progress
                        percent={68}
                        showInfo={false}
                        strokeColor="#faad14"
                        size="small"
                        style={{ marginTop: '8px' }}
                      />
                      <div className="metric-status warning">警告</div>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="metric-item">
                    <div className="metric-icon-wrapper disk">
                      <DashboardOutlined className="metric-icon" />
                    </div>
                    <div className="metric-details">
                      <div className="metric-title">磁盘使用率</div>
                      <div className="metric-value">
                        <AnimatedNumber value={32} suffix="%" />
                      </div>
                      <Progress
                        percent={32}
                        showInfo={false}
                        strokeColor="#52c41a"
                        size="small"
                        style={{ marginTop: '8px' }}
                      />
                      <div className="metric-status normal">正常</div>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="metric-item">
                    <div className="metric-icon-wrapper network">
                      <LineChartOutlined className="metric-icon" />
                    </div>
                    <div className="metric-details">
                      <div className="metric-title">网络带宽</div>
                      <div className="metric-value">
                        <AnimatedNumber value={156} suffix="Mbps" />
                      </div>
                      <Progress
                        percent={78}
                        showInfo={false}
                        strokeColor="#1890ff"
                        size="small"
                        style={{ marginTop: '8px' }}
                      />
                      <div className="metric-status normal">正常</div>
                    </div>
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

export default withAuth(ManagePage);
