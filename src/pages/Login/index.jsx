import LoginApi from '@/api/LoginApi';
import { HOME_PATH, LOGO, TITLE } from '@/config';
import buildMenu from '@/utils/buildMenu';
import { MyIcon } from '@/utils/iconUtil';
import { baseURL } from '@/utils/request';
import { getToken, setToken, setUsername } from '@/utils/tokenUtil';
import {
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  NumberOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Divider, message, Space, Tabs, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { history, useModel } from 'umi';

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
  const [mathCaptcha, setMathCaptcha] = useState({ question: '', answer: '' });
  const { countdown: captchaCountdown, start: startCountdown } = useCountdown();
  const [resetAccount, setResetAccount] = useState('');
  const [verifyStage, setVerifyStage] = useState(false);
  const formRef = useRef();

  useEffect(() => {
    if (getToken()) {
      history.replace(HOME_PATH);
    }
    generateMathCaptcha();
  }, []);

  const generateMathCaptcha = () => {
    formRef.current?.resetFields(['captcha']);
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setMathCaptcha({
      question: `${num1} + ${num2} = ?`,
      answer: String(num1 + num2),
    });
  };

  const handleSubmit = async (values) => {
    setLoginBtnDisabled(true);
    try {
      if (loginType === 'register') {
        await handleRegister(values);
      } else if (loginType === 'forget') {
        if (verifyStage) {
          await handleResetPassword(values);
        } else {
          await handleVerifyAccount(values);
        }
      } else {
        await handleLogin(values);
      }
    } finally {
      setLoginBtnDisabled(false);
    }
  };

  const handleLogin = async (values) => {
    const { success, data } =
      loginType === 'phone'
        ? await LoginApi.loginByPhone({
            phone: values.phone,
            code: values.code,
            loginType,
          })
        : loginType === 'mailbox'
          ? await LoginApi.loginByEmail({
              email: values.email,
              code: values.code,
              loginType,
            })
          : await LoginApi.loginByAccount({ ...values, loginType });
    if (success) {
      await afterLoginSuccess(data?.data);
    }
  };

  const handleRegister = async (values) => {
    if (values.captcha !== mathCaptcha.answer) {
      message.warning('验证码错误');
      return;
    }
    if (values.password !== values.confirmPassword) {
      message.warning('两次密码输入不一致');
      return;
    }
    const { success } = await LoginApi.register({
      userName: values.username,
      password: values.password,
      email: values.email,
      phone: values.phone,
    });

    if (success) {
      message.success('注册成功，请登录');
      setLoginType('account');
    } else {
      generateMathCaptcha();
    }
  };

  const afterLoginSuccess = async (data) => {
    setToken(data.token);
    setUsername(data.username);
    const { success: menuSuccess, data: menuDataResponse } =
      await LoginApi.getMenu(data?.username);

    if (menuSuccess && menuDataResponse?.data?.length > 0) {
      const { menuData, routeList } = buildMenu(menuDataResponse.data);
      await setInitialState({
        ...initialState,
        currentUser: { name: data?.username },
        menuData,
        routeList,
      });
    }
    message.success(data.username + '，欢迎回来');
    history.push(HOME_PATH);
  };

  const handleSendCaptcha = async (info) => {
    try {
      const isEmail = loginType === 'mailbox';
      const regex = isEmail
        ? /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
        : /^1[3-9]\d{9}$/;
      if (!regex.test(info)) {
        const msg = isEmail ? '邮箱格式不正确' : '手机号格式不正确';
        message.warning(msg);
        return Promise.reject();
      }
      const { success } = isEmail
        ? await LoginApi.sendVerificationCode(info)
        : await LoginApi.sendSmsCode(info);
      if (success) {
        message.success('证码已发送至' + info + '，请注意查收');
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

  const renderSwitchLinks = () => {
    if (['account', 'mailbox'].includes(loginType)) {
      return (
        <div
          style={{
            margin: '16px 0',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <Space>
            <a onClick={() => setLoginType('phone')}>手机号登录</a>
            <Divider type="vertical" style={{ marginLeft: 100 }} />
            <span>
              没有账号？<a onClick={() => setLoginType('register')}>点此注册</a>
            </span>
          </Space>
        </div>
      );
    }
    return (
      <div
        style={{
          margin: '16px 0',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <a onClick={() => setLoginType('account')}>返回账号登录</a>
      </div>
    );
  };

  const retrievePassword = () => {
    setLoginType('forget');
    setVerifyStage(false);
    generateMathCaptcha();
  };

  // 新增账号验证方法
  const handleVerifyAccount = async (values) => {
    if (values.captcha !== mathCaptcha.answer) {
      message.warning('验证码错误');
      return;
    }
    try {
      const { success, data } = await LoginApi.verifyAccount(values.account);
      if (success) {
        message.success('账号信息认证成功');
        setVerifyStage(true);
        setResetAccount(data.username);
      }
    } catch (e) {
      message.warning('账号信息验证失败');
    } finally {
      generateMathCaptcha();
    }
  };

  // 新增密码重置方法
  const handleResetPassword = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.warning('两次密码输入不一致');
      return;
    }
    if (values.captcha !== mathCaptcha.answer) {
      message.warning('验证码错误');
      return;
    }

    try {
      const { success } = await LoginApi.resetPassword({
        userName: resetAccount,
        password: values.password,
      });

      if (success) {
        message.success('密码重置成功');
        setLoginType('account');
        setVerifyStage(false);
      }
    } catch (e) {
      message.warning('密码重置失败');
    } finally {
      generateMathCaptcha();
    }
  };

  // 新增忘记密码表单
  const forgetForm = (
    <div style={{ marginTop: 20 }}>
      <ProFormText
        name="account"
        placeholder="账号/手机/邮箱"
        rules={[{ required: true, message: '请输入账号信息' }]}
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined />,
        }}
      />
      <ProFormText
        name="captcha"
        placeholder={mathCaptcha.question}
        rules={[
          {
            validator: (_, value) =>
              value === mathCaptcha.answer
                ? Promise.resolve()
                : Promise.reject('验证码错误'),
          },
        ]}
        fieldProps={{
          size: 'large',
          prefix: <SafetyOutlined />,
          suffix: (
            <Button
              type="link"
              onClick={generateMathCaptcha}
              style={{ height: 25, padding: '0 15px' }}
            >
              刷新验证码
            </Button>
          ),
        }}
      />
      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <a onClick={() => setLoginType('account')}>返回登录</a>
      </div>
    </div>
  );

  // 新增重置密码表单
  const resetPasswordForm = (
    <div style={{ marginTop: 20 }}>
      <ProFormText
        name="username"
        placeholder="账号"
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined />,
          disabled: true,
        }}
        initialValue={resetAccount}
      />
      <ProFormText.Password
        name="password"
        placeholder="新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码至少6位' },
        ]}
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
      />
      <ProFormText.Password
        name="confirmPassword"
        placeholder="确认密码"
        rules={[{ required: true, message: '请确认密码' }]}
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
      />
      <ProFormText
        name="captcha"
        placeholder={mathCaptcha.question}
        rules={[
          {
            validator: (_, value) =>
              value === mathCaptcha.answer
                ? Promise.resolve()
                : Promise.reject('验证码错误'),
          },
        ]}
        fieldProps={{
          size: 'large',
          prefix: <SafetyOutlined />,
          suffix: (
            <Button
              type="link"
              onClick={generateMathCaptcha}
              style={{ height: 25, padding: '0 15px' }}
            >
              刷新验证码
            </Button>
          ),
        }}
      />
      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <a onClick={() => setLoginType('account')}>返回登录</a>
      </div>
    </div>
  );

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
      {renderSwitchLinks()}
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
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      />
      <ProFormCaptcha
        name="code"
        fieldProps={{
          size: 'large',
          prefix: <NumberOutlined />,
        }}
        placeholder="验证码"
        phoneName="email"
        captchaProps={{
          disabled: captchaCountdown > 0,
          style: {
            height: 40,
            lineHeight: '40px',
            padding: '0 15px',
          },
        }}
        onGetCaptcha={handleSendCaptcha}
        countDown={captchaCountdown}
      />
      {renderSwitchLinks()}
    </>
  );

  const phoneForm = (
    <div style={{ marginTop: 20 }}>
      <ProFormText
        name="phone"
        fieldProps={{
          size: 'large',
          prefix: <MobileOutlined />,
        }}
        placeholder="手机号"
        rules={[
          { required: true, message: '请输入手机号！' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ]}
      />
      <ProFormCaptcha
        name="code"
        fieldProps={{
          size: 'large',
          prefix: <NumberOutlined />,
        }}
        phoneName="phone"
        placeholder="验证码"
        captchaProps={{
          disabled: captchaCountdown > 0,
          style: {
            height: 40,
            lineHeight: '40px',
            padding: '0 15px',
          },
        }}
        onGetCaptcha={handleSendCaptcha}
        countDown={captchaCountdown}
      />
      {renderSwitchLinks()}
    </div>
  );

  const registerForm = (
    <div style={{ marginTop: 20 }}>
      <ProFormText
        name="username"
        placeholder="用户名"
        rules={[{ required: true, message: '请输入用户名！' }]}
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined />,
        }}
      />
      <ProFormText.Password
        name="password"
        placeholder="密码"
        rules={[
          { required: true, message: '请输入密码！' },
          { min: 6, message: '密码至少6位' },
        ]}
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
      />
      <ProFormText.Password
        name="confirmPassword"
        placeholder="确认密码"
        rules={[{ required: true, message: '请确认密码！' }]}
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
      />
      <ProFormText
        name="email"
        placeholder="邮箱"
        rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        fieldProps={{
          size: 'large',
          prefix: <MailOutlined />,
        }}
      />
      <ProFormText
        name="phone"
        placeholder="手机号"
        rules={[
          { required: true, message: '请输入手机号！' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ]}
        fieldProps={{
          size: 'large',
          prefix: <MobileOutlined />,
        }}
      />
      <ProFormText
        name="captcha"
        placeholder={mathCaptcha.question}
        rules={[
          {
            validator: (_, value) =>
              value === mathCaptcha.answer
                ? Promise.resolve()
                : Promise.reject('验证码错误'),
          },
        ]}
        fieldProps={{
          size: 'large',
          prefix: <SafetyOutlined />,
          suffix: (
            <Button
              type="link"
              onClick={generateMathCaptcha}
              style={{
                height: 25,
                lineHeight: '20px',
                padding: '0 15px',
              }}
            >
              刷新验证码
            </Button>
          ),
        }}
      />
      {renderSwitchLinks()}
    </div>
  );

  const loginFormActions = (
    <>
      {!['forget', 'register'].includes(loginType) && (
        <div
          style={{
            margin: '16px 0',
            textAlign: 'center',
            width: '100%',
            fontSize: 14,
          }}
        >
          <a onClick={() => retrievePassword()}>已有账号，忘记密码？</a>
        </div>
      )}
      {!['register'].includes(loginType) && (
        <>
          <Divider plain style={{ color: '#7e8299' }}>
            其他登录方式
          </Divider>
          <Space className="w-full justify-between px-2" wrap={false}>
            {[
              {
                icon: 'github',
                handler: 'getGithubLoginURL',
                tip: 'GitHub',
              },
              { icon: 'gitee', handler: 'getGiteeLoginURL', tip: 'Gitee' },
              { icon: 'gitlab', handler: 'getGitLabURL', tip: 'GitLab' },
              { icon: 'feishu', handler: 'getFeiShuLoginURL', tip: '飞书' },
            ].map((item, index) => (
              <Button
                key={index}
                type="text"
                onClick={() => {
                  if (item.handler === 'getFeiShuLoginURL') {
                    message.warning('该功能尚未开发完成');
                    return;
                  }
                  LoginApi[item.handler]('cos').then((res) => {
                    res.success &&
                      window.open(baseURL + res.data.url, '_parent');
                  });
                }}
              >
                <Tooltip title={`使用${item.tip}登录`}>
                  <MyIcon type={`icon-${item.icon}`} style={{ fontSize: 30 }} />
                </Tooltip>
              </Button>
            ))}
            <Button type="text" onClick={() => message.warning('敬请期待...')}>
              <Tooltip title="更多登录方式">
                <MyIcon type="icon-gengduo" style={{ fontSize: 30 }} />
              </Tooltip>
            </Button>
          </Space>
        </>
      )}
    </>
  );

  return (
    <ProConfigProvider>
      <LoginFormPage
        formRef={formRef}
        backgroundImageUrl="/img/background.jpg"
        logo={LOGO}
        title={TITLE}
        disabled={loginBtnDisabled}
        onFinish={handleSubmit}
        submitter={{
          searchConfig: {
            submitText:
              loginType === 'register'
                ? '立即注册'
                : loginType === 'forget'
                  ? verifyStage
                    ? '重置密码'
                    : '立即认证'
                  : '立即登录',
          },
          resetButtonProps: { style: { display: 'none' } },
          render: (_, dom) => dom,
        }}
        actions={loginFormActions}
      >
        {['account', 'mailbox'].includes(loginType) && (
          <Tabs
            centered
            activeKey={loginType}
            items={[
              { label: '账号登录', key: 'account' },
              { label: '邮箱登录', key: 'mailbox' },
            ]}
            onChange={setLoginType}
          />
        )}
        {
          {
            account: accountForm,
            mailbox: mailboxForm,
            phone: phoneForm,
            register: registerForm,
            forget: verifyStage ? resetPasswordForm : forgetForm,
          }[loginType]
        }
      </LoginFormPage>
    </ProConfigProvider>
  );
};

export default Login;
