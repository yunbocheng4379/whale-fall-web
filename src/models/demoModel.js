const defaultState = () => ({
  title: sessionStorage.getItem('title') || 'Home to the DEV team!',
})

// 状态仓库
const demoModel = {
  namespace: 'demoModel',
  state: defaultState(),
  reducers: {
    updateAction(state, {payload}) {
      return {...state, ...payload}
    },
    reset: defaultState,
  },
  effects: {
    * demoEffect({payload}, {call, put, select}) {
      const state = yield select(state => state.demoModel)
      sessionStorage.setItem('title', payload.title)
      yield put({
        type: 'updateAction',
        payload: {...state, ...payload}
      })
    },
    * resetEffect({payload}, {call, put, select}) {
      sessionStorage.removeItem('title')
      yield put({
        type: 'reset',
      })
    },
  },
  subscriptions: {
    onlyStipulatePageExecute({dispatch, history}) {
      return history.listen(({pathname, query}) => {
        if (pathname === '/dva/page1') {
          dispatch({
            type: 'updateAction',
            payload: query
          })
        }
      })
    }
  }
}

export default demoModel
