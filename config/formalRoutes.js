const formalRoutes = [
  {
    path: '/account',
    name: '记账',
    icon: 'icon-hashiqi',
    routes: [
      {
        path: '/personage',
        name: '个人记账',
        component: '@/pages/Account/PersonAge',
        access: 'allowAdminAccessRoute',
      },
      {
        path: '/team',
        name: '共同记账',
        component: '@/pages/Account/Team',
        access: 'allowAdminAccessRoute',
      },
      {
        path: '/statistic',
        name: '账单统计',
        component: '@/pages/Account/Statistic',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: '/map',
    name: '旅行地图',
    icon: 'icon-jinmao',
    component: '@/pages/Map',
    access: 'allowAnyoneAccessRoute',
  },
  {
    path: '/agent',
    name: 'AI智能',
    icon: 'icon-fadou',
    routes: [
      {
        path: '/ask',
        name: 'AI问答',
        component: '@/pages/Agent/Ask',
        access: 'allowAdminAccessRoute',
      },
      {
        path: '/image',
        name: 'AI图像',
        component: '@/pages/Agent/Image',
        access: 'allowAdminAccessRoute',
      },
      {
        path: '/video',
        name: 'AI视频',
        component: '@/pages/Agent/Video',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
];

export default formalRoutes;
