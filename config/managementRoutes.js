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
