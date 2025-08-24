import {withAuth} from '@/components/Auth';
import {PageContainer, ProCard} from '@ant-design/pro-components';
import {Card, Col, Row} from 'antd';
import {AppstoreOutlined, UserOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import styles from './index.less';

const featureList = [
  {
    title: '用户权限',
    icon: <UserOutlined className={styles.icon} />,
    desc: '管理系统用户的权限角色，分配不同操作权限，保障系统安全性。',
    color: 'linear-gradient(135deg, #42a5f5, #478ed1)',
    path: '/authority/role',
  },
  {
    title: '菜单权限',
    icon: <AppstoreOutlined className={styles.icon} />,
    desc: '管理系统菜单访问权限，控制不同角色访问不同菜单，提高系统灵活性。',
    color: 'linear-gradient(135deg, #66bb6a, #43a047)',
    path: '/authority/menu',
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="权限系统概述" className={styles.pageContainer}>
      <ProCard className={styles.introCard}>
        <h2 className={styles.title}>欢迎权限配置功能</h2>
        <p className={styles.subtitle}>
          通过权限系统，你可以灵活管理用户角色及菜单访问控制，提高系统安全性和可控性。
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
