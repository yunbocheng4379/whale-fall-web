export default function access(initialState) {
  const { routeList = [] } = initialState;

  return {
    allowAnyoneAccessRoute: true,
    validationRoute: (route) => {
      return routeList.includes(route.path);
    },
  };
}
