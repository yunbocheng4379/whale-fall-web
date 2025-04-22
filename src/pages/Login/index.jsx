import LoginApi from '@/api/LoginApi';
import AvatarUpload from '@/components/AvatarUpload';
import Footer from '@/components/Footer';
import { HOME_PATH, LOGO, TITLE } from '@/config';
import useCountdown from '@/hooks/useCountdown';
import buildMenu from '@/utils/buildMenu';
import { MyIcon } from '@/utils/iconUtil';
import { baseURL } from '@/utils/request';
import { getCounter, removeAvatarUrl, setAvatarUrl } from '@/utils/storage';
import {
  getToken,
  removeToken,
  removeUsername,
  removeUserRole,
  setToken,
  setUsername,
  setUserRole,
} from '@/utils/tokenUtil';
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

const RESET_STAGES = {
  ACCOUNT_VERIFY: 1,
  CODE_VERIFY: 2,
  RESET_PASSWORD: 3,
};

const Login = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [loginType, setLoginType] = useState('account');
  const [loginBtnDisabled, setLoginBtnDisabled] = useState(false);
  const [mathCaptcha, setMathCaptcha] = useState({ question: '', answer: '' });
  const {
    countdown: captchaCountdown,
    start: startCountdown,
    reset: resetCountdown,
  } = useCountdown();
  const [lastCaptchaType, setLastCaptchaType] = useState('');
  const [resetAccount, setResetAccount] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetStage, setResetStage] = useState(RESET_STAGES.ACCOUNT_VERIFY);
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

  const handleSwitchLoginType = (type) => {
    if (type !== lastCaptchaType) {
      resetCountdown();
    }
    setLoginType(type);
  };

  const handleSubmit = async (values) => {
    setLoginBtnDisabled(true);
    try {
      if (loginType === 'register') {
        await handleRegister(values);
      } else if (loginType === 'forget') {
        switch (resetStage) {
          case RESET_STAGES.ACCOUNT_VERIFY:
            await handleVerifyAccount(values);
            break;
          case RESET_STAGES.CODE_VERIFY:
            await handleVerifyCode(values);
            break;
          case RESET_STAGES.RESET_PASSWORD:
            await handleResetPassword(values);
            break;
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
    if (values.password !== values.confirmPassword) {
      message.warning('两次密码输入不一致');
      return;
    }
    const { success } = await LoginApi.register({
      userName: values.username,
      password: values.password,
      email: values.email,
      phone: values.phone,
      avatarUrl: values.avatarUrl,
    });

    if (success) {
      message.success('注册成功，请登录');
      setLoginType('account');
    } else {
      generateMathCaptcha();
    }
  };

  const afterLoginSuccess = async (data) => {
    setAvatarUrl(data?.avatarUrl);
    setToken(data?.token);
    setUsername(data?.username);
    setUserRole(data?.role);
    const { success: menuSuccess, data: menuDataResponse } =
      await LoginApi.getMenu({
        userName: data?.username,
        menuType: getCounter(),
      });
    if (menuSuccess && menuDataResponse?.data?.length > 0) {
      const { menuData, routeList } = buildMenu(menuDataResponse.data);
      await setInitialState({
        ...initialState,
        currentUser: { name: data?.username },
        menuData,
        routeList,
      });
      history.push(HOME_PATH, { fromLogin: true });
    } else {
      removeToken();
      removeUsername();
      removeUserRole();
      removeAvatarUrl();
    }
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
        setLastCaptchaType(isEmail ? 'mailbox' : 'phone');
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
            <a onClick={() => handleSwitchLoginType('phone')}>手机号登录</a>
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
    setResetStage(RESET_STAGES.ACCOUNT_VERIFY);
    setResetAccount('');
    generateMathCaptcha();
  };

  const handleAvatarUpload = (url) => {
    formRef.current?.setFieldsValue({
      avatarUrl: url,
    });
  };

  const handleVerifyAccount = async (values) => {
    try {
      const { success, data } = await LoginApi.verifyAccount(values.account);
      if (success) {
        const info = data?.data;
        const sendSuccess = await handleSendResetCode(info?.email, 0);
        if (sendSuccess) {
          setResetAccount(info?.userName);
          setResetEmail(info?.email);
          setResetStage(RESET_STAGES.CODE_VERIFY);
        }
      }
    } catch (e) {
      message.warning('账号信息验证失败');
    } finally {
      generateMathCaptcha();
    }
  };

  const handleResetPassword = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.warning('两次密码输入不一致');
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
      }
    } catch (e) {
      message.warning('密码重置失败');
    } finally {
      generateMathCaptcha();
    }
  };

  const handleSendResetCode = async (email, flag) => {
    try {
      const { success } = await LoginApi.sendResetCode(email);
      if (success) {
        if (flag === 0) {
          message.success('账号信息认证成功，验证码已发送至' + email);
        } else {
          message.success('验证码已发送至' + email);
        }
        return true;
      }
      return false;
    } catch (error) {
      message.error('验证码发送失败');
      return false;
    }
  };

  const handleVerifyCode = async (values) => {
    try {
      const { success } = await LoginApi.verifyResetCode({
        email: resetEmail,
        code: values.code,
      });
      if (success) {
        message.success('验证码校验成功');
        setResetStage(RESET_STAGES.RESET_PASSWORD);
        return true;
      }
      return false;
    } catch (error) {
      message.error('验证码验证失败');
      return false;
    }
  };

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
        <a onClick={() => setLoginType('account')}>返回账号登录</a>
      </div>
    </div>
  );

  const verificationCodeForm = (
    <div style={{ marginTop: 20 }}>
      <ProFormText
        name="code"
        placeholder="请输入6位邮箱验证码"
        rules={[{ required: true, message: '请输入验证码' }]}
        fieldProps={{
          size: 'large',
          prefix: <SafetyOutlined />,
          suffix: (
            <Button
              type="link"
              onClick={() => handleSendResetCode(resetEmail, 1)}
              style={{ height: 25, padding: '0 15px' }}
            >
              重新发送
            </Button>
          ),
        }}
      />
      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <a onClick={() => setResetStage(RESET_STAGES.ACCOUNT_VERIFY)}>
          返回上一步
        </a>
      </div>
    </div>
  );

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
          { min: 8, message: '密码至少8位' },
          { max: 32, message: '密码最多32位' },
          {
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            message: '必须包含大写字母、小写字母和数字',
          },
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
        <a onClick={() => setLoginType('account')}>返回账号登录</a>
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
        rules={[{ required: true, message: '请输入用户名' }]}
      />
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
        placeholder="密码"
        rules={[{ required: true, message: '请输入密码' }]}
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
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      />
      <ProFormCaptcha
        name="code"
        fieldProps={{
          size: 'large',
          prefix: <NumberOutlined />,
        }}
        rules={[{ required: true, message: '请输入验证码' }]}
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
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ]}
      />
      <ProFormCaptcha
        name="code"
        fieldProps={{
          size: 'large',
          prefix: <NumberOutlined />,
        }}
        rules={[{ required: true, message: '请输入验证码' }]}
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
        rules={[{ required: true, message: '请输入用户名' }]}
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined />,
        }}
      />
      <ProFormText.Password
        name="password"
        placeholder="密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 8, message: '密码至少8位' },
          { max: 32, message: '密码最多32位' },
          {
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            message: '必须包含大写字母、小写字母和数字',
          },
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
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ]}
        fieldProps={{
          size: 'large',
          prefix: <MobileOutlined />,
        }}
      />
      <ProFormText
        name="avatarUrl"
        rules={[
          {
            validator: (_, value) =>
              value !== null && value !== undefined
                ? Promise.resolve()
                : Promise.reject('请上传头像'),
          },
        ]}
      >
        <AvatarUpload onUploadSuccess={handleAvatarUpload} />
      </ProFormText>
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
                  ? resetStage === RESET_STAGES.CODE_VERIFY
                    ? '验证验证码'
                    : resetStage === RESET_STAGES.RESET_PASSWORD
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
            onChange={(values) => handleSwitchLoginType(values)}
          />
        )}
        {
          {
            account: accountForm,
            mailbox: mailboxForm,
            phone: phoneForm,
            register: registerForm,
            forget:
              resetStage === RESET_STAGES.ACCOUNT_VERIFY
                ? forgetForm
                : resetStage === RESET_STAGES.CODE_VERIFY
                  ? verificationCodeForm
                  : resetPasswordForm,
          }[loginType]
        }
      </LoginFormPage>
      <Footer />
    </ProConfigProvider>
  );
};

export default Login;
