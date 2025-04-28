import { MyIcon } from '@/utils/iconUtil';
import routes from '../../config/routes';
let rootMenuList = [];
let childrenMenuList = [];

const getRootMenuAndChildrenMenu = (menuList) => {
  menuList.forEach((menu) => {
    if (menu.children) childrenMenuList.push(menu);
    if (!menu.children) return childrenMenuList.push(menu);
    return getRootMenuAndChildrenMenu(menu.children);
  });
};

const accessList = ['allowAnyoneAccessRoute', 'allowAccessDemoRoute'];

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
      if (item.icon !== undefined) {
        item.icon = <MyIcon type={item.icon} />;
      }
      if (item.routes) {
        const hasPermissionAccessRouteList = item.routes
          .filter(
            (route) =>
              accessList.includes(route.access) ||
              routeList.includes(route.path),
          )
          .map((route) => {
            const menuIndex = routeList.indexOf(route.path);
            if (menuIndex !== -1) {
              route.id = childrenMenuList[menuIndex].id;
              route.menuId = childrenMenuList[menuIndex].menuId;
              route.name = childrenMenuList[menuIndex].text;
              route.rank = childrenMenuList[menuIndex].rank;
            }
            return route;
          });
        return { ...item, routes: hasPermissionAccessRouteList };
      } else if (
        accessList.includes(item.access) ||
        routeList.includes(item.path)
      ) {
        return item;
      }
      return null; // 明确返回 null
    })
    .filter((item) => {
      if (!item) return false; // 过滤掉 null
      if (item.routes) {
        return item.routes.length > 0; // 保留有非空 routes 的项
      }
      return true; // 保留没有 routes 的项
    });

  menuData = menuData.map((menu) => {
    if (menu.routes) {
      menu.routes.sort((menu1, menu2) => menu1.rank - menu2.rank);
    }
    return menu;
  });

  return { menuData, routeList };
};
export default buildMenu;
