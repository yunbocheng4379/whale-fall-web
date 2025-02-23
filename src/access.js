export default function access(initialState) {

  const {routeList = []} = initialState ?? {}

  return {
    allowAnyoneAccessRoute: true,
    allowAdminAccessRoute: (route) => {
      return routeList.includes(route.path)
    },
    allowAccessDemoRoute: true,
  }
}
