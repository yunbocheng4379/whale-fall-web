import routes from '../../config/routes';

let rootMenuList = [];
let childrenMenuList = [];

const getRootMenuAndChildrenMenu = (menuList) => {
  menuList.forEach((menu) => {
    if (!menu.children) {
      childrenMenuList.push(menu);
      return;
    }
    rootMenuList.push(menu);
    getRootMenuAndChildrenMenu(menu.children);
  });
};

const buildMenu = (menuList, accessList = []) => {
  rootMenuList = [];
  childrenMenuList = [];
  getRootMenuAndChildrenMenu(menuList);

  // 生成完整的路由白名单列表
  const routeList = childrenMenuList
    .filter((menu) => menu?.route) // 增加空值保护
    .map((menu) => menu.route);

  const menuData = routes
    .map((item) => {
      if (item.routes) {
        const filteredRoutes = item.routes
          .filter(
            (route) =>
              route.access === 'allowAnyoneAccessRoute' ||
              routeList.includes(route.path),
          )
          .map((route) => {
            const targetMenu = childrenMenuList.find(
              (menu) => menu.route === route.path,
            );
            return targetMenu
              ? {
                  ...route,
                  id: targetMenu.id,
                  menuId: targetMenu.menuId,
                }
              : route;
          });

        return filteredRoutes.length > 0
          ? { ...item, routes: filteredRoutes }
          : null;
      }

      const isValidItem =
        accessList.includes(item.access) || routeList.includes(item.path);
      return isValidItem ? item : null;
    })
    .filter(Boolean) // 简化过滤逻辑
    .map((menu) => ({
      ...menu,
      routes: menu.routes?.sort((a, b) => a.rank - b.rank),
    }));

  return {
    menuData,
    routeList, // 确保返回 routeList
  };
};

export default buildMenu;
