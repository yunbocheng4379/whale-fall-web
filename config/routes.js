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
  { path: "/*", component: "@/pages/404.jsx" },
]

export default routes
