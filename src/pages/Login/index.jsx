import LoginApi from '@/api/LoginApi';
import { HOME_PATH, LOGO, TITLE } from '@/config';
import buildMenu from '@/utils/buildMenu';
import { waitTime } from '@/utils/commonUtil';
import { getToken, setToken, setUsername } from '@/utils/tokenUtil';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { message, Tabs } from 'antd';
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
    await waitTime(0.5);
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
      message.success('登录成功');
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
    <ProConfigProvider dark>
      <LoginFormPage
        backgroundImageUrl="/img/background.jpg"
        logo={LOGO}
        title={TITLE}
        disabled={loginBtnDisabled}
        onFinish={handleLogin}
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
