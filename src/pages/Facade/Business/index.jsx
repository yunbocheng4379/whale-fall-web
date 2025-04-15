import WhaleApi from '@/api/WhaleApi';
import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button } from 'antd';
import coupleImage from '/public/img/couple/us.jpg';

const HomePage = () => {
  return (
    <PageContainer
      title={false}
      style={{ backgroundColor: '#FFF6FF', minHeight: '86vh' }}
    >
      <ProCard
        style={{
          backgroundColor: '#FFE5F1',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src={coupleImage}
            alt="情侣图片"
            style={{
              width: '300px',
              height: 'auto',
              borderRadius: '16px',
              marginBottom: '24px',
            }}
          />
          <h1
            style={{
              color: '#FF69B4',
              fontFamily: 'Comic Sans MS, cursive, sans-serif',
            }}
          >
            情侣日常记录
          </h1>
          <p
            style={{ color: '#FF8C00', fontSize: '18px', marginBottom: '24px' }}
          >
            欢迎来到你们的甜蜜小窝！在这里，你们可以记录下每一个美好的瞬间。
          </p>
        </div>
      </ProCard>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button
          type="primary"
          style={{
            backgroundColor: '#FF69B4',
            borderColor: '#FF69B4',
            fontSize: '18px',
            padding: '12px 24px',
          }}
          onClick={() => {
            WhaleApi.queryWhale({ id: 1 });
          }}
        >
          开始记录
        </Button>
      </div>
    </PageContainer>
  );
};

export default withAuth(HomePage);
