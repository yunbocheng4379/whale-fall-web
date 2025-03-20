import WhaleApi from '@/api/WhaleApi';
import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button } from 'antd';
import coupleImage from '/public/img/couple/us.jpg';

const HomePage = () => {
  return (
    <PageContainer
      title={false}
      style={{ backgroundColor: '#FFF6FF', minHeight: '100vh' }}
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
        <div
          style={{
            backgroundColor: '#FFF0F5',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              color: '#FF69B4',
              fontFamily: 'Comic Sans MS, cursive, sans-serif',
            }}
          >
            使用说明
          </h2>
          <p style={{ color: '#FF8C00', fontSize: '16px' }}>
            点击下面的按钮，开始记录你们的甜蜜日常吧！
          </p>
        </div>
        <div
          style={{
            backgroundColor: '#FFF0F5',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h2
            style={{
              color: '#FF69B4',
              fontFamily: 'Comic Sans MS, cursive, sans-serif',
            }}
          >
            关于我们
          </h2>
          <p style={{ color: '#FF8C00', fontSize: '16px' }}>
            这个小应用是为了让你们更好地记录和分享彼此的生活，让每一个瞬间都变得更加珍贵。
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
            const { success, data } = WhaleApi.queryWhale({ id: 1 });
            console.log(success);
            console.log(data);
          }}
        >
          开始记录
        </Button>
      </div>
    </PageContainer>
  );
};

export default withAuth(HomePage);
