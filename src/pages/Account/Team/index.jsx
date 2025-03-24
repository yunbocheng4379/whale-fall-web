import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import MDEditor from '@uiw/react-md-editor';

const HomePage = () => {
  return (
    <PageContainer title={false}>
      <ProCard>
        <MDEditor.Markdown
          source={
            '# 共同记账概述\n' + '\n' + '> 欢迎使用共同记账功能。\n' + '\n'
          }
        />
      </ProCard>
    </PageContainer>
  );
};

export default withAuth(HomePage);
