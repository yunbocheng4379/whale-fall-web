import routes from "../../config/routes";

const rootMenuList = []
const childrenMenuList = []

const getRootMenuAndChildrenMenu = (menuList) => {
  menuList.forEach(menu => {
    if (!menu.children)
      return childrenMenuList.push(menu)
    rootMenuList.push(menu)
    return getRootMenuAndChildrenMenu(menu.children)
  })
}

const accessList = ['allowAnyoneAccessRoute', 'allowAccessDemoRoute']

/**
 * 构建菜单，注：该方法适用于父菜单下只包含一级子菜单的情况
 * @param menuList
 * @returns {{menuData: (*&{routes: []})[], routeList: *[]}}
 */
const buildMenu = (menuList) => {
  getRootMenuAndChildrenMenu(menuList)
  const routeList = childrenMenuList.map(menu => menu.route)
  let menuData = routes.map(item => {
    let hasPermissionAccessRouteList = []
    if (item.routes) {
      hasPermissionAccessRouteList = item.routes.filter(route => accessList.includes(route.access) || routeList.includes(route.path)).map(route => {
        const menuIndex = routeList.indexOf(route.path)
        if (menuIndex !== -1) {
          route.id = childrenMenuList[menuIndex].id
          route.menuId = childrenMenuList[menuIndex].menu_id
          route.name = childrenMenuList[menuIndex].text
          route.rank = childrenMenuList[menuIndex].rank
        }
        return route
      })
      return {
        ...item,
        routes: hasPermissionAccessRouteList
      }
    } else if (accessList.includes(item.access) || routeList.includes(item.path)) {
      return item
    }
  }).filter(item => {
    if (item) {
      if (item.routes && item.routes.length > 0) {
        return item
      } else if (!item.routes) {
        return item
      }
    }
  })

  menuData = menuData.map(menu => {
    if (menu.routes)
      menu.routes.sort((menu1, menu2) => menu1.rank - menu2.rank)
    return menu
  })
  return {menuData, routeList}
}

export default buildMenu
