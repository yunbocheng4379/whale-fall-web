import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Row, Col, Card } from 'antd';
import { RobotOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './index.less';

const featureList = [
  {
    title: 'AI问答',
    icon: <RobotOutlined className={styles.icon} />,
    desc: '提供智能问答服务，用户可以输入问题，系统基于AI进行理解并生成答案。',
    color: 'linear-gradient(135deg, #42a5f5, #478ed1)',
    path: '/agent/ask',
  },
  {
    title: 'AI图片',
    icon: <PictureOutlined className={styles.icon} />,
    desc: '通过AI生成图片或进行图片处理、编辑功能，满足创意和设计需求。',
    color: 'linear-gradient(135deg, #66bb6a, #43a047)',
    path: '/agent/image',
  },
  {
    title: 'AI视频',
    icon: <VideoCameraOutlined className={styles.icon} />,
    desc: '提供AI视频生成或分析功能，例如自动剪辑、生成视频内容或智能推荐。',
    color: 'linear-gradient(135deg, #ffa726, #fb8c00)',
    path: '/agent/video',
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="AI功能概述" className={styles.pageContainer}>
      <ProCard className={styles.introCard}>
        <h2 className={styles.title}>欢迎使用AI功能</h2>
        <p className={styles.subtitle}>
          在这里，你可以体验AI问答、AI图片生成和AI视频处理，全面提升工作与创意效率。
        </p>
      </ProCard>

      <Row gutter={[24, 24]} className={styles.featureRow}>
        {featureList.map((item, idx) => (
          <Col xs={24} sm={12} md={8} key={idx}>
            <Card
              className={styles.featureCard}
              style={{ background: item.color, cursor: 'pointer' }}
              hoverable
              onClick={() => navigate(item.path)}
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
