const managementRoutes = [
  {
    path: 'log',
    name: '日志',
    icon: 'icon-log',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Log/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'register',
        name: '登录日志',
        icon: 'icon-register',
        component: '@/pages/Log/Register',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'operate',
        name: '操作日志',
        icon: 'icon-operate',
        component: '@/pages/Log/Operate',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'authority',
    name: '配置',
    icon: 'icon-authority',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Authority/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'role',
        name: '用户权限',
        icon: 'icon-role',
        component: '@/pages/Authority/Role',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'menu',
        name: '菜单权限',
        icon: 'icon-menu',
        component: '@/pages/Authority/Menu',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'model',
        name: '模型配置',
        icon: 'icon-model',
        component: '@/pages/Authority/Model',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'knowledge',
        name: '知识库管理',
        icon: 'icon-knowledge',
        component: '@/pages/Authority/Knowledge',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'docs',
        name: '知识库文档',
        icon: 'icon-model',
        component: '@/pages/Authority/Docs',
        access: 'allowAdminAccessRoute',
        hideInMenu: true,
      },
      {
        path: 'prompt',
        name: '提示词管理',
        icon: 'icon-prompt',
        component: '@/pages/Authority/Prompt',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'other',
    name: '其他配置',
    icon: 'icon-other',
    component: '@/pages/Other',
    access: 'allowAdminAccessRoute',
  },
];

export default managementRoutes;
