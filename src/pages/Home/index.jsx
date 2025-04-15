import { withAuth } from '@/components/Auth';
import BusinessPage from '@/pages/Facade/Business/index';
import ManagePage from '@/pages/Facade/Manage/index';
import { getCounter } from '@/utils/storage';
import { PageContainer } from '@ant-design/pro-components';

const HomePage = () => {
  const CurrentPage = getCounter() === 0 ? BusinessPage : ManagePage;

  return (
    <PageContainer title={false}>
      <CurrentPage />
    </PageContainer>
  );
};

export default withAuth(HomePage);
