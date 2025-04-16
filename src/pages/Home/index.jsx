import { withAuth } from '@/components/Auth';
import BusinessPage from '@/pages/Facade/Business/index';
import ManagePage from '@/pages/Facade/Manage/index';
import { getDescription } from '@/utils/commonUtil';
import { MyIcon } from '@/utils/iconUtil';
import { getCounter } from '@/utils/storage';
import { getUsername } from '@/utils/tokenUtil';
import { PageContainer } from '@ant-design/pro-components';
import { notification } from 'antd';
import { useEffect } from 'react';
import { history, useLocation } from 'umi';

const HomePage = () => {
  const location = useLocation();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.info({
      message: <b>{getUsername() + '，欢迎回来~'}</b>,
      description: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span>{getDescription()}</span>
        </div>
      ),
      icon: <MyIcon type="icon-correct" style={{ fontSize: 20 }} />,
    });
    // 弹出欢迎语后立即重置状态
    history.replace({
      ...location,
      state: {
        ...location.state,
        fromLogin: false,
      },
    });
  };

  useEffect(() => {
    if (location.state?.fromLogin) {
      openNotification();
    }
  }, [location.state]);

  const CurrentPage = getCounter() === 0 ? BusinessPage : ManagePage;

  return (
    <>
      {contextHolder}
      <PageContainer title={false}>
        <CurrentPage />
      </PageContainer>
    </>
  );
};

export default withAuth(HomePage);
