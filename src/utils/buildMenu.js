import routes from '/config/routes';

let rootMenuList = [];
let childrenMenuList = [];

const getRootMenuAndChildrenMenu = (menuList) => {
  menuList.forEach((menu) => {
    if (!menu.children) return childrenMenuList.push(menu);
    rootMenuList.push(menu);
    return getRootMenuAndChildrenMenu(menu.children);
  });
};

/**
 * 构建菜单，注：该方法适用于父菜单下只包含一级子菜单的情况
 * @param menuList
 * @returns {{menuData: (*&{routes: []})[], routeList: *[]}}
 */
const buildMenu = (menuList) => {
  rootMenuList = [];
  childrenMenuList = [];
  getRootMenuAndChildrenMenu(menuList);
  const routeList = childrenMenuList.map((menu) => menu.route);
  let menuData = routes
    .map((item) => {
      let hasPermissionAccessRouteList = [];
      if (item.routes) {
        hasPermissionAccessRouteList = item.routes
          .filter(
            (route) =>
              route.access === 'allowAnyoneAccessRoute' ||
              routeList.includes(route.path),
          )
          .map((route) => {
            const menuIndex = routeList.indexOf(route.path);
            if (menuIndex !== -1) {
              route.id = childrenMenuList[menuIndex].id;
              route.menuId = childrenMenuList[menuIndex].menuId;
            }
            return route;
          });
        return {
          ...item,
          routes: hasPermissionAccessRouteList,
        };
      } else if (
        accessList.includes(item.access) ||
        routeList.includes(item.path)
      ) {
        return item;
      }
      return undefined;
    })
    .filter((item) => {
      if (item) {
        if (item.routes && item.routes.length > 0) {
          return item;
        } else if (!item.routes) {
          return item;
        }
      }
      return false;
    });

  menuData = menuData.map((menu) => {
    if (menu.routes)
      menu.routes.sort((menu1, menu2) => menu1.rank - menu2.rank);
    return menu;
  });
  return { menuData, routeList };
};

export default buildMenu;
