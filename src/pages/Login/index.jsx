import {Fragment, useEffect, useState} from "react";
import {history, useModel} from "umi";
import {message, Tabs} from "antd";
import {LoginFormPage, ProConfigProvider, ProFormText} from "@ant-design/pro-components";
import {LockOutlined, UserOutlined} from "@ant-design/icons";
import {getToken, setToken, setUsername} from "@/utils/tokenUtil";
import {HOME_PATH, TITLE, LOGO} from "@/config";
import {waitTime} from "@/utils/commonUtil";
import buildMenu from "@/utils/buildMenu";
import LoginApi from "../../api/LoginApi";

const Login = () => {

  const {initialState, setInitialState} = useModel('@@initialState')
  const [loginType, setLoginType] = useState('account')
  const [loginBtnDisabled, setLoginBtnDisabled] = useState(false)

  useEffect(() => {
    if (getToken()) {
      if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href)
      }
      history.push(HOME_PATH)
    }
  }, [])

  const handleLogin = async (loginParams) => {
    setLoginBtnDisabled(true)
    await waitTime(0.6)
    if (loginType === 'account')
      await accountLogin(loginParams)
    else
      message.warning('新登录类型待开发')
  }

  /**
   * 账号登陆
   */
  const accountLogin = async (loginParams) => {
    const {success, data} = await LoginApi.login(loginParams)
    if (success && data?.token) {
      setToken(data.token)
      setUsername(loginParams.username)
      // TODO: 实际使用时，需调用 lakers系统的菜单接口
      // const {success, data: menuList} = await LakersApi.getMenu(data.token)
      const {success, data: menuList} = {
        data: [
          {
            text: '欢迎',
            route: '/welcome',
            rank: 0
          },
        ],
        success: true
      }
      if (success && menuList.length > 0) {
        let {menuData, routeList} = buildMenu(menuList)
        await setInitialState({
          ...initialState,
          currentUser: {name: loginParams.username},
          menuData,
          routeList
        })
      }
      await setLoginBtnDisabled(false)
      history.push(HOME_PATH)
    } else {
      setLoginBtnDisabled(false)
    }
  }

  const loginTabItems = [
    {
      label: '账号登录',
      key: 'account',
    }
  ]

  const accountForm = (
    <Fragment>
      <ProFormText
        name='username'
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined/>,
        }}
        placeholder={'请输入用户名'}
        rules={[
          {
            required: true,
            type: 'string',
            whitespace: true,
            message: '请输入用户名！',
          }
        ]}
      />
      <ProFormText.Password
        name='password'
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined/>,
        }}
        placeholder={'请输入密码'}
        rules={[
          {
            required: true,
            type: 'string',
            whitespace: true,
            message: '请输入密码！',
          },
        ]}
      />
    </Fragment>
  )

  return (
    <ProConfigProvider dark>
      <LoginFormPage
        backgroundImageUrl='/img/background.jpg'
        logo={LOGO}
        title={TITLE}
        disabled={loginBtnDisabled}
        onFinish={handleLogin}
      >
        <Tabs
          centered
          activeKey={loginType}
          items={loginTabItems}
          onChange={(activeKey) => setLoginType(activeKey)}/>
        {loginType === 'account' && (
          accountForm
        )}
      </LoginFormPage>
    </ProConfigProvider>
  )
}

export default Login
