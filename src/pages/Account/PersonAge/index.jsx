import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import MDEditor from '@uiw/react-md-editor';

const HomePage = () => {
  return (
    <PageContainer title={false}>
      <ProCard>
        <MDEditor.Markdown
          source={
            '# 个人记账概述\n' + '\n' + '> 欢迎使用个人记账功能。\n' + '\n'
          }
        />
      </ProCard>
    </PageContainer>
  );
};

export default withAuth(HomePage);
