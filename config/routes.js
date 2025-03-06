const routes = [
  {
    path: '/',
    redirect: '/home',
    layout: false,
    access: 'allowAnyoneAccessRoute',
  },
  {
    path: '/login',
    component: '@/pages/Login',
    layout: false,
    access: 'allowAnyoneAccessRoute',
  },
  {
    name: '首页',
    path: '/home',
    component: '@/pages/Home',
    icon: 'HomeOutlined',
    access: 'allowAnyoneAccessRoute',
  },
  {
    path: 'account',
    name: '记账',
    icon: 'VideoCameraOutlined',
    access: 'allowAnyoneAccessRoute',
    routes: [
      {
        path: '/account/personage',
        name: '个人记账',
        component: '@/pages/Account/PersonAge',
        access: 'validationRoute',
      },
      {
        path: '/account/team',
        name: '共同记账',
        component: '@/pages/Account/Team',
        access: 'validationRoute',
      },
      {
        path: '/account/statistic',
        name: '账单统计',
        component: '@/pages/Account/Statistic',
        access: 'validationRoute',
      },
    ],
  },
  {
    path: 'map',
    name: '旅行地图',
    icon: 'VideoCameraOutlined',
    access: 'allowAnyoneAccessRoute',
    component: '@/pages/Map',
  },
  {
    path: 'agent',
    name: 'AI智能',
    icon: 'VideoCameraOutlined',
    access: 'allowAnyoneAccessRoute',
    routes: [
      {
        path: '/agent/ask',
        name: 'AI问答',
        component: '@/pages/Agent/Ask',
        access: 'validationRoute',
      },
      {
        path: '/agent/image',
        name: 'AI图像',
        component: '@/pages/Agent/Image',
        access: 'validationRoute',
      },
      {
        path: '/agent/video',
        name: 'AI视频',
        component: '@/pages/Agent/Video',
        access: 'validationRoute',
      },
    ],
  },
  {
    path: '/*',
    component: '@/pages/404.jsx',
  },
];

export default routes;
