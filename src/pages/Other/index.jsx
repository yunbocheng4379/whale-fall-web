import { withAuth } from '@/components/Auth';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import MDEditor from '@uiw/react-md-editor';

const HomePage = () => {
  return (
    <PageContainer title={false}>
      <ProCard>
        <MDEditor.Markdown
          source={'# 其他后台页面配置\n' + '\n' + '> 待接入新功能。\n' + '\n'}
        />
      </ProCard>
    </PageContainer>
  );
};

export default withAuth(HomePage);
