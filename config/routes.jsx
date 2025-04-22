import formalRoutes from './formalRoutes';
import managementRoutes from './managementRoutes';

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
    icon: 'icon-home',
    access: 'allowAnyoneAccessRoute',
  },
  {
    name: '账号设置',
    path: '/setting',
    component: '@/pages/Setting',
    access: 'allowAnyoneAccessRoute',
    hideInMenu: true,
  },
  ...formalRoutes,
  ...managementRoutes,
  {
    path: '/*',
    component: '@/pages/404.jsx',
  },
];

function combineRoutes(routes, fatherPath) {
  routes.map((item) => {
    if (item.path) {
      if (!item.path.startsWith('/') && !fatherPath.endsWith('/'))
        item.path = '/' + item.path;
      item.path = fatherPath + item.path;
    }
    if (item.routes) combineRoutes(item.routes, item.path);
    if (!item.access) item.access = 'allowAnyoneAccessRoute';
    return item;
  });
}

combineRoutes(routes, '');
export default routes;
