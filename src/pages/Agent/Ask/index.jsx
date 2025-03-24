import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import MDEditor from '@uiw/react-md-editor';

const HomePage = () => {
  return (
    <PageContainer title={false}>
      <ProCard>
        <MDEditor.Markdown
          source={'# AI问答概述\n' + '\n' + '> 欢迎使用AI问答功能。\n' + '\n'}
        />
      </ProCard>
    </PageContainer>
  );
};

export default withAuth(HomePage);
