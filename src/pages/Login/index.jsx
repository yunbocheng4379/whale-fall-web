import LoginApi from '@/api/LoginApi';
import { HOME_PATH, LOGO, TITLE } from '@/config';
import buildMenu from '@/utils/buildMenu';
import { MyIcon } from '@/utils/iconUtil';
import { baseURL } from '@/utils/request';
import { getToken, setToken, setUsername } from '@/utils/tokenUtil';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Divider, message, Space, Tabs, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { history, useModel } from 'umi';

// 自定义倒计时 Hook
const useCountdown = (initialSeconds = 60) => {
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const start = (seconds = initialSeconds) => {
    clearInterval(timerRef.current);
    setCountdown(seconds);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return { countdown, start };
};

const Login = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [loginType, setLoginType] = useState('account');
  const [loginBtnDisabled, setLoginBtnDisabled] = useState(false);
  const { countdown: captchaCountdown, start: startCountdown } = useCountdown();

  useEffect(() => {
    if (getToken()) {
      if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
      }
      history.push(HOME_PATH);
    }
  }, []);

  const handleLogin = async (loginParams) => {
    setLoginBtnDisabled(true);
    await login({ ...loginParams, loginType });
  };

  const handleSendCaptcha = async (email) => {
    try {
      // 1. 前端邮箱格式验证
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        message.warning('邮箱格式不正确');
        return Promise.reject();
      }
      const { success } = await LoginApi.sendVerificationCode(email);
      if (success) {
        message.success('验证码已发送,请注意查收');
        startCountdown();
        return Promise.resolve();
      } else {
        return Promise.reject();
      }
    } catch (error) {
      message.error('网络错误,获取验证码失败');
      return Promise.reject();
    }
  };

  const login = async (loginParams) => {
    const { success, data } = await LoginApi.login(loginParams);
    const token = data?.data?.token;
    const username = data?.data?.username;

    if (success && token && username) {
      setToken(token);
      setUsername(username);
      const { success: menuSuccess, data: menuDataResponse } =
        await LoginApi.getMenu(username);

      if (menuSuccess && menuDataResponse?.data?.length > 0) {
        const { menuData, routeList } = buildMenu(menuDataResponse.data);
        await setInitialState({
          ...initialState,
          currentUser: { name: username },
          menuData,
          routeList,
        });
      }
      message.success('欢迎回来');
      history.push(HOME_PATH);
    }
    setLoginBtnDisabled(false);
  };

  const loginTabItems = [
    { label: '账号登录', key: 'account' },
    { label: '邮箱登录', key: 'mailbox' },
  ];

  const accountForm = (
    <>
      <ProFormText
        name="username"
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined />,
        }}
        placeholder="用户名"
        rules={[{ required: true, message: '请输入用户名！' }]}
      />
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
        placeholder="密码"
        rules={[{ required: true, message: '请输入密码！' }]}
      />
    </>
  );

  const mailboxForm = (
    <>
      <ProFormText
        name="email"
        fieldProps={{
          size: 'large',
          prefix: <MailOutlined />,
        }}
        placeholder="邮箱"
        rules={[
          { required: true, message: '请输入邮箱！' },
          {
            pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/,
            message: '邮箱格式不正确',
          },
        ]}
      />
      <ProFormCaptcha
        name="code"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
          placeholder: '验证码',
        }}
        rules={[{ required: true, message: '请输入验证码！' }]}
        phoneName="email"
        captchaProps={{
          disabled: captchaCountdown > 0,
        }}
        onGetCaptcha={handleSendCaptcha}
        countDown={captchaCountdown}
      />
    </>
  );

  return (
    <ProConfigProvider>
      <LoginFormPage
        backgroundImageUrl="/img/background.jpg"
        logo={LOGO}
        title={TITLE}
        disabled={loginBtnDisabled}
        onFinish={handleLogin}
        actions={
          <>
            <div>
              <Divider plain style={{ color: '#7e8299' }}>
                其他登录方式
              </Divider>
            </div>
            <Space
              style={{
                width: '100%',
                justifyContent: 'space-between',
                padding: '0 8px',
                flexWrap: 'nowrap',
              }}
            >
              <Button
                style={{
                  padding: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                }}
                onClick={() => {
                  window.location.href =
                    baseURL + '/oauth2/authorization/github';
                }}
              >
                <Tooltip placement="top" title={'使用GitHub账号登录'}>
                  <MyIcon type={'icon-github'} style={{ fontSize: 30 }} />
                </Tooltip>
              </Button>
              <Button
                style={{
                  padding: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                }}
                onClick={() => {
                  window.location.href =
                    baseURL + '/oauth2/authorization/gitee';
                }}
              >
                <Tooltip placement="top" title={'使用Gitee账号登录'}>
                  <MyIcon type={'icon-gitee'} style={{ fontSize: 30 }} />
                </Tooltip>
              </Button>
              <Button
                style={{
                  padding: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                }}
                onClick={() => {
                  LoginApi.getGitLibURL('cos').then((res) => {
                    if (res.success) {
                      window.open(res.data.url, '_parent');
                    }
                  });
                }}
              >
                <Tooltip placement="top" title={'使用GitLib账号登录'}>
                  <MyIcon type={'icon-gitlib'} style={{ fontSize: 30 }} />
                </Tooltip>
              </Button>
              <Button
                style={{
                  padding: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                }}
                onClick={() => {
                  LoginApi.getFeiShuLoginURL('cos').then((res) => {
                    if (res.success) {
                      window.open(res.data.url, '_parent');
                    }
                  });
                }}
              >
                <Tooltip placement="top" title={'使用飞书账号登录'}>
                  <MyIcon type={'icon-feishu'} style={{ fontSize: 30 }} />
                </Tooltip>
              </Button>
              <Button
                style={{
                  padding: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                }}
                onClick={() => {
                  message.warning('敬请期待...');
                }}
              >
                <Tooltip placement="top" title={'更多登录方式'}>
                  <MyIcon type={'icon-gengduo'} style={{ fontSize: 30 }} />
                </Tooltip>
              </Button>
            </Space>
          </>
        }
        submitter={{
          searchConfig: {
            submitText: loginBtnDisabled ? '登录中...' : '立即登录',
          },
        }}
      >
        <Tabs
          centered
          activeKey={loginType}
          items={loginTabItems}
          onChange={setLoginType}
        />
        {loginType === 'account' && accountForm}
        {loginType === 'mailbox' && mailboxForm}
      </LoginFormPage>
    </ProConfigProvider>
  );
};

export default Login;
