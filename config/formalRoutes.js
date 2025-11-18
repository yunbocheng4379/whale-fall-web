const formalRoutes = [
  {
    path: 'account',
    name: '记账',
    icon: 'icon-account',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Account/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'personage',
        name: '个人记账',
        icon: 'icon-person-age',
        component: '@/pages/Account/PersonAge',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'team',
        name: '共同记账',
        icon: 'icon-team',
        component: '@/pages/Account/Team',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'invest',
        name: '理财投资',
        icon: 'icon-invest',
        component: '@/pages/Account/Invest',
        access: 'allowAdminAccessRoute',
      },
      {
        path: 'statistic',
        name: '账单统计',
        icon: 'icon-statistic',
        component: '@/pages/Account/StatisticsPage',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'couple',
    name: '情侣日常',
    icon: 'icon-couple',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Couple/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'day',
        name: '纪念日',
        icon: 'icon-day',
        component: '@/pages/Couple/Day',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'pet',
    name: '萌宠',
    icon: 'icon-kitty',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Pet/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'food',
        name: '宠物口粮',
        icon: 'icon-food',
        component: '@/pages/Pet/Food',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'agent',
    name: 'AI智能',
    icon: 'icon-agent',
    access: 'allowAdminAccessRoute',
    routes: [
      {
        index: true,
        component: '@/pages/Agent/Welcome',
        access: 'allowAnyoneAccessRoute',
      },
      {
        path: 'ask',
        name: 'AI问答',
        icon: 'icon-ask',
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
        icon: 'icon-video',
        component: '@/pages/Agent/Video',
        access: 'allowAdminAccessRoute',
      },
    ],
  },
  {
    path: 'map',
    name: '旅行地图',
    icon: 'icon-map',
    component: '@/pages/Map',
    access: 'allowAdminAccessRoute',
  },
  {
    path: 'oauth-callback',
    component: '@/pages/OAuthCallback',
    layout: false,
  },
];

export default formalRoutes;
