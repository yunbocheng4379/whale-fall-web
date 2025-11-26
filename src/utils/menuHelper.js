const flattenMenuData = (menuList = []) => {
  const result = [];

  const traverse = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((menu) => {
      if (!menu) return;
      result.push({
        name: menu?.text,
        path: menu?.route,
        icon: menu?.icon,
      });
      if (Array.isArray(menu.children) && menu.children.length) {
        traverse(menu.children);
      }
    });
  };

  traverse(menuList);

  return result;
};

export { flattenMenuData };
