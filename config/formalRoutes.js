const formalRoutes = [
  {
    path: 'account',
    name: '记账',
    icon: 'icon-jizhang',
    routes: [
      {
        index: true,
        component: '@/pages/Account/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'personage',
        name: '个人记账',
        icon: 'icon-keji',
        component: '@/pages/Account/PersonAge',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'team',
        name: '共同记账',
        icon: 'icon-hashiqi',
        component: '@/pages/Account/Team',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'statistic',
        name: '账单统计',
        icon: 'icon-jinmao',
        component: '@/pages/Account/Statistic',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'agent',
    name: 'AI智能',
    icon: 'icon-rengongzhineng',
    routes: [
      {
        index: true,
        component: '@/pages/Agent/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'ask',
        name: 'AI问答',
        icon: 'icon-wenda',
        component: '@/pages/Agent/Ask',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'image',
        name: 'AI图像',
        icon: 'icon-image',
        component: '@/pages/Agent/Image',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'video',
        name: 'AI视频',
        icon: 'icon-shipin',
        component: '@/pages/Agent/Video',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'map',
    name: '旅行地图',
    icon: 'icon-shijieditu',
    component: '@/pages/Map',
    access: 'allowAnyoneAccessRoute',
  },
];

export default formalRoutes;
