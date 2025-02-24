import React from "react";
import {PageContainer, ProCard} from "@ant-design/pro-components";
import MDEditor from "@uiw/react-md-editor";
import {withAuth} from "@/components/Auth";
import {Button} from "antd";
import WhaleApi from "../../api/WhaleApi";

const HomePage = () => {

  return (
    <PageContainer title={false}>
      <ProCard>
        <MDEditor.Markdown source={'# 前端框架\n' +
          '\n' +
          '> 本模板设计的核心主旨：在对文件无删减的情况下，规范化高效开发，直面业务。\n' +
          '\n' +
          '## 一、使用说明\n' +
          '\n' +
          '## 1. Build Setup\n' +
          '\n' +
          '```bash\n' +
          '# 安装依赖（强烈推荐使用pnpm）\n' +
          'pnpm\n' +
          '\n' +
          '# 启动服务\n' +
          'pnpm start\n' +
          '```\n' +
          '\n' +
          '浏览器访问 [http://localhost:10000](http://localhost:10000)\n' +
          '\n' +
          '## 2. 发布\n' +
          '\n' +
          '```bash\n' +
          'pnpm build\n' +
          '```\n' +
          '\n' +
          '## 3. 开发流程\n' +
          '\n' +
          '```text\n' +
          '1.关闭模板示例，仅需注释或删除config/routes.js文件内的"...demoRoutes,"即可。\n' +
          '2.如果没有配置路由的访问权限，访问权限默认为"allowAdminAccessRoute"，等同于若想使用该菜单，则需在lakers配置。\n' +
          '           如果项目还未对接lakers，则可设置路由的access为"allowAnyoneAccessRoute"。\n' +
          '3.前端端口号配置位于.env文件中，后端端口号配置位于src/utils/request.js中。\n' +
          '           注意：前端未配置代理，跨域问题需在后端配置解决。\n' +
          '4.若项目需构建至后端，则需修改config/config.js内的打包路径配置项。\n' +
          '5.若使用alibaba iconfont，需将iconfont.js放至public/js目录下。\n' +
          '6.开发后期，登录和菜单权限功能需在src/api/LakersApi.js文件内替换成本系统封装的接口地址，接口数据的返回格式可参考mock/api.js。\n' +
          '```\n' +
          '\n' +
          '> 注意：业务示例使用了真实接口，jar包位于项目根目录下的demo-2.0.jar，通过"java -jar demo-2.0.jar"，即可启动\n' +
          '\n' +
          '## 二、项目介绍\n' +
          '\n' +
          '### 1. 目录结构\n' +
          '\n' +
          '```text\n' +
          '├─ .idea\n' +
          '├─ config                           # umi 配置，包含路由，构建等配置\n' +
          '├─ mock                             # 本地模拟数据\n' +
          '├─ node_modules\n' +
          '├─ public                           # 本地静态资源\n' +
          '├─ src\n' +
          '│  ├─ .umi\n' +
          '│  ├─ .umi-production\n' +
          '│  ├─ api\n' +
          '│  ├─ components                    # 业务通用组件\n' +
          '│  ├─ models                        # 全局 dva model\n' +
          '│  ├─ pages                         # 业务页面\n' +
          '│  ├─ utils                         # 工具类目录\n' +
          '│  ├─ access.js                     # 权限\n' +
          '│  ├─ app.jsx                       # 运行时配置文件\n' +
          '│  ├─ global.less                   # 全局样式\n' +
          '│  ├─ manifest.json\n' +
          '│  └─ typings.d.ts\n' +
          '├─ .editorconfig\n' +
          '├─ .env                             # 环境变量\n' +
          '├─ .eslintignore\n' +
          '├─ .eslintrc.js\n' +
          '├─ .gitignore\n' +
          '├─ .prettierignore\n' +
          '├─ .prettierrc.js\n' +
          '├─ .stylelintrc.js\n' +
          '├─ jsconfig.json\n' +
          '├─ package.json\n' +
          '├─ README.md\n' +
          '└─ tsconfig.json\n' +
          '```\n' +
          '\n' +
          '## 三、规范\n' +
          '\n' +
          '### 1. 命名及代码书写规范\n' +
          '\n' +
          '```text\n' +
          '1. 目录名全小写、组件目录名使用大驼峰命名法\n' +
          '2. js、ts、jsx、tsx文件名命名，除src/api目录下文件采用大驼峰命名，其余文件均采用小驼峰命名\n' +
          '3. 代码中每段业务逻辑可采用空一行隔开，不要出现大量无意义的空行，建议常用"ctrl+alt+l"格式化代码\n' +
          '4. 关于JS代码单双引及分号的使用，import的内容全部采用"双引+分号"；代码需保证每个文件风格统一，推荐全部使用单引不加分号\n' +
          '5. 业务繁多的情况下，目录尽可能按照业务细粒度拆分\n' +
          '```\n' +
          '\n' +
          '### 2. 开发规范\n' +
          '\n' +
          '```text\n' +
          '1. package.json文件编辑规范（基于只新增或编辑，不删除）。对于依赖而言，若需引入新依赖，需确保依赖功能不冗余，引入后需通知其他开发人员；\n' +
          '   对于依赖版本，为防止UI组件兼容问题，尽可能不做变更。\n' +
          '2. 严禁在前端直接调用其他业务系统的接口。\n' +
          '3. 代码提交规范：git commit -m "type: content"，type如下所示：\n' +
          '   feat - 功能性更新\n' +
          '   fix - bug 修复\n' +
          '   style - 改变代码格式（如删除空行、格式化代码、去除不必要的分号等等）\n' +
          '   refactor - 既不是功能更新也不是 bug 修复的更改（建议对代码进行重构的时候使用）\n' +
          '   perf - 代码改变提高了性能\n' +
          '   test - 添加测试用例或者修改测试用例\n' +
          '   build - 由打包工具造成的改变（如gulp、webpack编译文件）\n' +
          '   chore - 既不是源码的修改，也不是测试用例的修改（修改项目相关配置时可以使用）\n' +
          '   revert - 撤销之前的提交\n' +
          '```\n'}/>
      </ProCard>
      <Button type={'primary'} onClick={async () => {
        WhaleApi.queryWhale({id: 2})
      }}>新增</Button>
    </PageContainer>
  )
}

export default withAuth(HomePage)
