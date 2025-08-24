import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Row, Col, Card } from 'antd';
import { FileTextOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './index.less';

const featureList = [
  {
    title: '登录日志',
    icon: <LoginOutlined className={styles.icon} />,
    desc: '记录用户登录系统的行为，包括登录时间、IP和登录状态，保障系统安全。',
    color: 'linear-gradient(135deg, #66bb6a, #43a047)',
    path: '/log/register',
  },
  {
    title: '操作日志',
    icon: <FileTextOutlined className={styles.icon} />,
    desc: '记录系统中用户的操作行为，包括增删改查等操作，便于审计和排查问题。',
    color: 'linear-gradient(135deg, #42a5f5, #478ed1)',
    path: '/log/operate',
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="日志系统概述" className={styles.pageContainer}>
      <ProCard className={styles.introCard}>
        <h2 className={styles.title}>欢迎使用日志系统</h2>
        <p className={styles.subtitle}>
          在这里，你可以查看系统操作日志和登录日志，全面掌握系统操作情况与安全状态。
        </p>
      </ProCard>

      <Row gutter={[24, 24]} className={styles.featureRow}>
        {featureList.map((item, idx) => (
          <Col xs={24} sm={12} md={12} lg={12} key={idx}>
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
