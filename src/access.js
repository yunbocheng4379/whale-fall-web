export default function access(initialState) {
  const { routeList = [], menuData = [] } = initialState || {};

  return {
    allowAnyoneAccessRoute: true,
    validationRoute: (route) => {
      return routeList.includes(route.path);
    },
  };
}
