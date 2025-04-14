const managementRoutes = [
  {
    path: 'log',
    name: '日志',
    icon: 'icon-jizhang',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Logs/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'register',
        name: '登录日志',
        icon: 'icon-keji',
        component: '@/pages/Logs/Register',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'operate',
        name: '操作日志',
        icon: 'icon-hashiqi',
        component: '@/pages/Logs/Operate',
        access: 'allowAnyoneAccessRoute',
      },
    ],
  },
  {
    path: 'authority',
    name: '配置',
    icon: 'icon-rengongzhineng',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Authority/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'role',
        name: '用户角色',
        icon: 'icon-wenda',
        component: '@/pages/Authority/Role',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'menu',
        name: '菜单权限',
        icon: 'icon-image',
        component: '@/pages/Authority/Menu',
        access: 'allowAnyoneAccessRoute',
      },
    ],
  },
  {
    path: 'other',
    name: '其他配置',
    icon: 'icon-shijieditu',
    component: '@/pages/Other',
    access: 'allowAdminAccessRoute',
  },
];

export default managementRoutes;
