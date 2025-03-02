const routes = [
  {
    path: '/',
    redirect: '/home',
    layout: false,
    access: 'allowAnyoneAccessRoute'
  },
  {
    path: '/login',
    component: '@/pages/Login',
    layout: false,
    access: 'allowAnyoneAccessRoute'
  },
  {
    name: '首页',
    path: '/home',
    component: '@/pages/Home',
    icon: 'icon-home',
    access: 'allowAccessDemoRoute'
  },
  {
    path: '',
    name: '路由',
    icon: 'VideoCameraOutlined',
    routes: [
      {
        path: 'demo1',
        name: '路由一',
        component: '@/pages/Demo/DemoOne'
      },
      {
        path: 'demo2',
        name: '路由二',
        component: '@/pages/Demo/DemoTwo',
        hideInMenu: true,
      },
      {
        path: 'demo3',
        name: '路由三',
        component: '@/pages/Demo/DemoThree',
      }
    ]
  },
  {
    path: "/*",
    component: "@/pages/404.jsx"
  }
]

export default routes
