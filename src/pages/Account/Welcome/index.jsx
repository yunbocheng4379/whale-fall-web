import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Row, Col, Card } from 'antd';
import {
  PieChartOutlined,
  TeamOutlined,
  FundOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './index.less';

const featureList = [
  {
    title: '个人记账',
    icon: <PieChartOutlined className={styles.icon} />,
    desc: '记录个人日常收支，随时掌握每一笔消费与收入，帮助你培养良好的理财习惯。',
    color: 'linear-gradient(135deg, #42a5f5, #478ed1)',
    path: '/account/personage',
  },
  {
    title: '共同记账',
    icon: <TeamOutlined className={styles.icon} />,
    desc: '支持家庭、情侣、室友等共同账本，轻松管理共享支出，公平透明不再尴尬。',
    color: 'linear-gradient(135deg, #66bb6a, #43a047)',
    path: '/account/team',
  },
  {
    title: '理财投资',
    icon: <FundOutlined className={styles.icon} />,
    desc: '记录理财产品的买入卖出，掌握收益与风险情况，让投资更清晰透明。',
    color: 'linear-gradient(135deg, #ffa726, #fb8c00)',
    path: '/account/invest',
  },
  {
    title: '账单统计',
    icon: <BarChartOutlined className={styles.icon} />,
    desc: '多维度数据分析与可视化图表，全面展示你的消费结构与投资趋势。',
    color: 'linear-gradient(135deg, #ab47bc, #8e24aa)',
    path: '/account/statistic',
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="记账概述" className={styles.pageContainer}>
      <ProCard className={styles.introCard}>
        <h2 className={styles.title}>欢迎使用记账系统</h2>
        <p className={styles.subtitle}>
          在这里，你可以全方位管理个人与家庭的收支情况，帮助你理清消费、优化理财、实现财富增长。
        </p>
      </ProCard>

      <Row gutter={[24, 24]} className={styles.featureRow}>
        {featureList.map((item, idx) => (
          <Col xs={24} sm={12} md={12} lg={6} key={idx}>
            <Card
              className={styles.featureCard}
              style={{ background: item.color }}
              onClick={() => navigate(item.path)}
              hoverable
            >
              <div className={styles.featureContent}>
                {item.icon}
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
};

export default withAuth(HomePage);
