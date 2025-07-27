import AccountApi from '@/api/AccountApi';
import { withAuth } from '@/components/Auth';
import AvatarUpload from '@/components/AvatarUpload';
import { LOGIN_PATH } from '@/config';
import useCountdown from '@/hooks/useCountdown';
import { MyIcon } from '@/utils/iconUtil';
import { removeAvatarUrl, removeEmail, setAvatarUrl } from '@/utils/storage';
import {
  getUsername,
  removeToken,
  removeUsername,
  removeUserRole,
} from '@/utils/tokenUtil';
import {
  BranchesOutlined,
  ContactsOutlined,
  LinkOutlined,
  LockOutlined,
  MailOutlined,
  NumberOutlined,
  PhoneOutlined,
  QuestionCircleOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProForm,
  ProFormCaptcha,
  ProFormItem,
  ProFormText,
  ProTable,
  SettingDrawer,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { history, useLocation, useModel } from 'umi';
import './index.less';

const SettingPage = () => {
  const [userInfo, setUserInfo] = useState({});
  const [visible, setVisible] = useState(false);
  const [destroyVisible, setDestroyVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentField, setCurrentField] = useState('');
  const {
    countdown: captchaCountdown,
    start: startCountdown,
    reset: resetCountdown,
  } = useCountdown();
  const [lastCaptchaType, setLastCaptchaType] = useState('');
  const [thirdPartyData, setThirdPartyData] = useState([]);
  const [userId, setUserId] = useState(0);
  const [oldEmail, setOldEmail] = useState('');
  const [oldPhone, setOldPhone] = useState('');
  const [form] = Form.useForm();

  // 系统设置相关状态
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const location = useLocation();

  useEffect(() => {
    fetchUserInfo().then((r) => {});
  }, []);

  const handleSwitchLoginType = (type) => {
    if (type !== lastCaptchaType) {
      resetCountdown();
    }
  };

  const threePartyColumns = [
    {
      title: '用户id',
      dataIndex: 'userId',
      width: 120,
      align: 'center',
      hidden: true,
    },
    {
      title: '平台名称',
      dataIndex: 'authType',
      width: 120,
      align: 'center',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '绑定账号',
      dataIndex: 'authName',
      width: 120,
      align: 'center',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '绑定状态',
      dataIndex: 'flag',
      width: 100,
      align: 'center',
      render: () => <Tag color={'success'}>已绑定</Tag>,
    },
    {
      title: '绑定时间',
      dataIndex: 'bandTime',
      width: 150,
      align: 'center',
    },
    {
      title: '操作',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={'确定要解绑【' + record.authType + '】？'}
            onConfirm={() => handleUnBind(record)}
            okText="确定"
            cancelText="取消"
            placement="top"
          >
            <Button danger size="small">
              解除绑定
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleUnBind = async (record) => {
    const { success } = await AccountApi.handleUnBind({
      authType: record.authType,
      id: record.userId,
      authName: record.authName,
    });
    if (success) {
      message.success('账号与' + record.authType + '平台解除三方认证成功');
      fetchUserInfo().then(() => {});
    }
  };

  const fetchUserInfo = async () => {
    const { success, data } =
      await AccountApi.getCurrentUserInfo(getUsername());
    if (success) {
      let userInfo = data.data;
      setThirdPartyData(userInfo?.userAuthList);
      setOldPhone(userInfo?.phone);
      setOldEmail(userInfo?.email);
      setUserId(userInfo?.id);
      setUserInfo({
        ...userInfo,
        phone:
          userInfo?.phone
            ?.toString()
            .replace(
              /(\d{3})\d+(\d{4})/,
              (_, g1, g2) => g1 + '*'.repeat(4) + g2,
            ) ?? '未知号码',
        email:
          userInfo?.email?.replace(
            /^([^@])(.*)([^@])(@.*)$/,
            (_, g1, g2, g3, g4) => g1 + '*'.repeat(g2.length) + g3 + g4,
          ) ?? '未知号码',
        password: '********',
      });
    }
  };

  const handleSubmit = async (values) => {
    if (currentField !== 'password') {
      if (currentStep === 1) {
        const { success } =
          currentField === 'email'
            ? await AccountApi.verifyEmailCode({
                email: oldEmail,
                code: values?.code,
              })
            : await AccountApi.verifyPhoneCode({
                phone: oldPhone,
                code: values?.code,
              });
        if (success) {
          message.success('账号安全验证通过');
          setCurrentStep(2);
        }
      } else {
        const { success } =
          currentField === 'email'
            ? await AccountApi.updateByEmail({
                userName: getUsername(),
                email: values?.newEmail,
              })
            : await AccountApi.updateByPhone({
                userName: getUsername(),
                phone: values?.newPhone,
              });
        if (success) {
          message.success(
            currentField === 'email' ? '邮箱修改成功' : '手机号修改成功',
          );
          fetchUserInfo().then(() => {});
          setVisible(false);
          setCurrentStep(1);
        }
      }
    } else {
      const { success } = await AccountApi.updateByPassword({
        userName: getUsername(),
        password: values?.password,
        newPassword: values?.newPassword,
      });
      if (success) {
        message.success('密码修改成功，请重新登录');
        removeToken();
        removeUsername();
        removeUserRole();
        removeAvatarUrl();
        removeEmail();
        history.push(LOGIN_PATH);
      }
    }
  };

  const showModifyModal = (field) => {
    handleSwitchLoginType(field);
    setLastCaptchaType(field);
    setCurrentField(field);
    setCurrentStep(1);
    setVisible(true);
    form.resetFields();
    form.setFieldsValue({
      phone: userInfo.phone,
      email: userInfo.email,
    });
  };

  const handleSendCaptcha = async () => {
    try {
      const isEmail = currentField === 'email';
      let info = isEmail ? oldEmail : oldPhone;
      const reg = isEmail
        ? /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
        : /^1[3-9]\d{9}$/;
      if (!reg.test(info)) {
        const msg = isEmail ? '邮箱格式不正确' : '手机号格式不正确';
        message.warning(msg);
        return Promise.reject();
      }
      const { success } = isEmail
        ? await AccountApi.sendResetEmailCode(info)
        : await AccountApi.sendResetSmsCode(info);
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

  const deleteAccount = async (values) => {
    const { success } = await AccountApi.deleteAccount({
      userName: getUsername(),
      password: values?.password,
      id: userId,
    });
    if (success) {
      setDestroyVisible(false);
      message.success('账户注销成功');
      removeToken();
      removeUserRole();
      removeAvatarUrl();
      removeUsername();
      removeEmail();
      history.push(LOGIN_PATH);
    }
  };

  const handleAvatarUpload = async (url) => {
    const { success } = await AccountApi.updateByAvatarUrl({
      userName: getUsername(),
      avatarUrl: url,
    });
    if (success) {
      message.success('头像修改成功');
      setAvatarUrl(url);
    }
  };

  const modalSteps = {
    phone: [
      {
        title: '账号安全验证',
        content: (
          <>
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'rgba(0, 0, 0, 0.88)',
                  marginBottom: 8,
                  fontFamily: '黑体, sans-serif',
                }}
              >
                你正在进行敏感操作，继续操作前请验证您的身份
              </div>
              <Alert
                message={
                  <Marquee pauseOnHover gradient={false}>
                    更换号码后，你将无法通过
                    【原手机号+验证码】登录。&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </Marquee>
                }
                type="warning"
                showIcon
                style={{
                  backgroundColor: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 4,
                }}
              />
            </div>
            <Form.Item
              style={{ marginTop: 20 }}
              label={
                <label>
                  原手机号&nbsp;
                  <Tooltip
                    color={'yellow'}
                    title={
                      <a
                        href="http://www.beian.gov.cn"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#000000' }}
                      >
                        号码已注销或停用？点此查看
                      </a>
                    }
                  >
                    <QuestionCircleOutlined style={{ color: 'green' }} />
                  </Tooltip>
                </label>
              }
              name="phone"
            >
              <Input disabled />
            </Form.Item>
            <ProFormCaptcha
              name="code"
              fieldProps={{
                size: 'large',
                prefix: <NumberOutlined />,
              }}
              rules={[{ required: true, message: '请输入验证码' }]}
              placeholder="验证码"
              phoneName="phone"
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
          </>
        ),
      },
      {
        title: '新手机号绑定',
        content: (
          <>
            <Alert
              message={
                <Marquee pauseOnHover gradient={false}>
                  更换手机号后，你将通过【新手机号+验证码】登录，【旧手机号】将失效。&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Marquee>
              }
              type="success"
              showIcon
              style={{
                marginTop: 30,
                backgroundColor: '#b2cfa5',
                border: '1px solid #b2cfa5',
                borderRadius: 4,
              }}
            />
            <Form.Item style={{ marginTop: 20 }}>
              <ProFormText
                name="newPhone"
                label="新手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                ]}
              />
            </Form.Item>
          </>
        ),
      },
    ],
    email: [
      {
        title: '账号安全验证',
        content: (
          <>
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'rgba(0, 0, 0, 0.88)',
                  marginBottom: 8,
                  fontFamily: '黑体, sans-serif',
                }}
              >
                你正在进行敏感操作，继续操作前请验证您的身份
              </div>
              <Alert
                message={
                  <Marquee pauseOnHover gradient={false}>
                    更换邮箱后，你将无法通过
                    【原邮箱+验证码】登录。&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </Marquee>
                }
                type="warning"
                showIcon
                style={{
                  backgroundColor: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 4,
                }}
              />
            </div>
            <Form.Item
              style={{ marginTop: 20 }}
              label={
                <label>
                  原邮箱&nbsp;
                  <Tooltip
                    color={'yellow'}
                    title={
                      <a
                        href="http://www.beian.gov.cn"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#000000' }}
                      >
                        邮箱已注销或停用？点此查看
                      </a>
                    }
                  >
                    <QuestionCircleOutlined style={{ color: 'green' }} />
                  </Tooltip>
                </label>
              }
              name="email"
            >
              <Input disabled />
            </Form.Item>
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
          </>
        ),
      },
      {
        title: '新邮箱绑定',
        content: (
          <>
            <Alert
              message={
                <Marquee pauseOnHover gradient={false}>
                  更换邮箱后，你将通过
                  【新邮箱+验证码】登录，【旧邮箱】将失效。&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Marquee>
              }
              type="success"
              showIcon
              style={{
                marginTop: 30,
                backgroundColor: '#b2cfa5',
                border: '1px solid #b2cfa5',
                borderRadius: 4,
              }}
            />
            <Form.Item style={{ marginTop: 20 }}>
              <ProFormText
                name="newEmail"
                label="新邮箱"
                rules={[{ type: 'email', message: '邮箱格式不正确' }]}
                fieldProps={{
                  prefix: <MailOutlined />,
                  suffix: (
                    <Tooltip title="邮箱已注销或停用？请联系客服">
                      <Button type="link" size="small">
                        遇到问题？
                      </Button>
                    </Tooltip>
                  ),
                }}
              />
            </Form.Item>
          </>
        ),
      },
    ],
    password: [
      {
        title: '修改登录密码',
        content: (
          <>
            <Alert
              message={
                <Marquee pauseOnHover gradient={false}>
                  您正在进行敏感操作，输入原密码以验证您的身份，验证通过后可修改密码。&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Marquee>
              }
              type="warning"
              showIcon
              style={{
                backgroundColor: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 4,
                marginTop: 20,
              }}
            />
            <ProFormItem style={{ marginTop: 20, marginBottom: 0 }}>
              <ProFormText.Password
                name="password"
                label={
                  <label>
                    原密码&nbsp;
                    <Tooltip
                      color={'yellow'}
                      title={
                        <a
                          href="http://www.beian.gov.cn"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#000000' }}
                        >
                          忘记密码？点此查看
                        </a>
                      }
                    >
                      <QuestionCircleOutlined style={{ color: 'green' }} />
                    </Tooltip>
                  </label>
                }
                rules={[{ required: true, message: '请输入原密码' }]}
                fieldProps={{
                  prefix: <LockOutlined />,
                }}
              />
            </ProFormItem>
            <ProFormText.Password
              name="newPassword"
              label="新密码"
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
                prefix: <LockOutlined />,
              }}
            />
            <ProFormText.Password
              name="confirmPassword"
              label="确认密码"
              dependencies={['newPassword']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入密码不一致'));
                  },
                }),
              ]}
              fieldProps={{
                prefix: <LockOutlined />,
              }}
            />
          </>
        ),
      },
    ],
  };

  const handleBindGitHub = () => {
    // 绑定方式后续研究
    console.log('handleBindGitHub');
  };

  const handleBindGitee = () => {
    console.log('handleBindGitee');
  };

  const handleBindGitLab = () => {
    console.log('handleBindGitLab');
  };

  const handleBindFeiShu = () => {
    console.log('handleBindFeiShu');
  };

  return (
    <PageContainer title={false} className="setting-page">
      <ProCard gutter={[24, 24]} wrap bodyStyle={{ padding: 0 }}>
        <ProCard gutter={24} wrap colSpan={24} bodyStyle={{ padding: 0 }}>
          <ProCard
            colSpan={{ xs: 24, sm: 12 }}
            title={
              <div>
                <span className="title-icon">
                  <ContactsOutlined />
                </span>
                账号信息
              </div>
            }
            bordered
            headerBordered
            className="setting-card account-info-card"
          >
            <div className="avatar-section">
              <AvatarUpload onUploadSuccess={handleAvatarUpload} />
            </div>
            <ProFormItem>
              <Descriptions column={1}>
                <Descriptions.Item
                  label={
                    <>
                      <MyIcon type={'icon-user'} /> <b>用户名称</b>
                    </>
                  }
                >
                  {userInfo?.userName}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <>
                      <MyIcon type={'icon-phone'} /> <b>手机号码</b>
                    </>
                  }
                >
                  {userInfo?.phone}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <>
                      <MyIcon type={'icon-email'} /> <b>用户邮箱</b>
                    </>
                  }
                >
                  {userInfo?.email}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <>
                      <MyIcon type={'icon-user_role'} /> <b>所属角色</b>
                    </>
                  }
                >
                  {userInfo?.roleName}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <>
                      <MyIcon type={'icon-sign'} /> <b>个人签名</b>
                    </>
                  }
                >
                  {userInfo?.sign}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <>
                      <MyIcon type={'icon-create_time'} /> <b>创建时间</b>
                    </>
                  }
                >
                  {userInfo?.createTime}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <>
                      <MyIcon type={'icon-update_time'} /> <b>更改时间</b>
                    </>
                  }
                >
                  {userInfo?.updateTime}
                </Descriptions.Item>
              </Descriptions>
            </ProFormItem>
          </ProCard>
          <ProCard
            colSpan={{ xs: 24, sm: 12 }}
            title={
              <div>
                <span className="title-icon">
                  <SecurityScanOutlined />
                </span>
                账号安全
                <Tooltip
                  title="可通过以下方式修改账号安全信息"
                  style={{ marginLeft: 8 }}
                >
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </div>
            }
            bordered
            headerBordered
            className="setting-card security-card"
          >
            <div className="security-item">
              <ProForm submitter={false}>
                <ProFormText
                  label={
                    <span>
                      <PhoneOutlined /> 手机号码
                    </span>
                  }
                  fieldProps={{
                    value: userInfo.phone,
                    readOnly: true,
                    suffix: (
                      <Button
                        type="link"
                        onClick={() => showModifyModal('phone')}
                      >
                        更换号码
                      </Button>
                    ),
                  }}
                />
              </ProForm>
            </div>
            <div className="security-item">
              <ProForm submitter={false}>
                <ProFormText
                  label={
                    <span>
                      <MailOutlined /> 邮箱
                    </span>
                  }
                  fieldProps={{
                    value: userInfo.email,
                    readOnly: true,
                    suffix: (
                      <Button
                        type="link"
                        onClick={() => showModifyModal('email')}
                      >
                        更换邮箱
                      </Button>
                    ),
                  }}
                />
              </ProForm>
            </div>
            <div className="security-item">
              <ProForm submitter={false}>
                <ProFormText
                  label={
                    <span>
                      <LockOutlined /> 登录密码
                    </span>
                  }
                  fieldProps={{
                    value: userInfo.password,
                    readOnly: true,
                    suffix: (
                      <Button
                        type="link"
                        onClick={() => showModifyModal('password')}
                      >
                        修改密码
                      </Button>
                    ),
                  }}
                />
              </ProForm>
            </div>
          </ProCard>
        </ProCard>

        <ProCard
          colSpan={24}
          direction="column"
          gutter={[24, 24]}
          bodyStyle={{ padding: 0 }}
        >
          <ProCard
            title={
              <div>
                <span className="title-icon">
                  <BranchesOutlined />
                </span>
                第三方账号绑定
                <Tooltip
                  title="三方账号绑定信息，可进行三方账号信息绑定、解除关联"
                  style={{ marginLeft: 8 }}
                >
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 400,
                    opacity: 0.9,
                  }}
                >
                  使用以下任一方式都可以登录到您的账号，避免由于某个账号失效导致无法登录
                </div>
              </div>
            }
            bordered
            headerBordered
            className="setting-card third-party-card"
          >
            {thirdPartyData.length > 0 ? (
              <ProTable
                dataSource={thirdPartyData}
                rowKey="key"
                search={false}
                toolBarRender={false}
                pagination={false}
                columns={threePartyColumns}
              />
            ) : (
              <></>
            )}
            <div className="third-party-bind-section">
              {(() => {
                // 定义所有支持的平台
                const allPlatforms = ['github', 'gitee', 'gitlab', 'feishu'];

                // 计算已绑定的平台数量
                const boundPlatforms = thirdPartyData.filter((item) =>
                  allPlatforms.includes(item.authType),
                );

                // 判断是否所有平台都已绑定
                const allBound = boundPlatforms.length === allPlatforms.length;

                if (allBound) {
                  // 所有平台都已绑定，只显示完成状态
                  return (
                    <div className="no-available-platforms">
                      <div className="no-platforms-icon">🎉</div>
                      <div className="no-platforms-text">
                        所有支持的第三方平台都已绑定
                      </div>
                    </div>
                  );
                } else {
                  // 还有未绑定的平台，显示绑定选项
                  return (
                    <>
                      <div className="section-header">
                        <div className="section-title">
                          <LinkOutlined className="section-icon" />
                          <span>可绑定的第三方账号</span>
                        </div>
                        <div className="section-subtitle">
                          绑定后可使用第三方账号快速登录，提升使用体验
                        </div>
                      </div>

                      <div className="bind-cards">
                        {[
                          {
                            type: 'github',
                            name: 'GitHub',
                            desc: '全球最大的代码托管平台',
                          },
                          {
                            type: 'gitee',
                            name: 'Gitee',
                            desc: '国内领先的代码托管平台',
                          },
                          {
                            type: 'gitlab',
                            name: 'GitLab',
                            desc: '企业级DevOps平台',
                          },
                          {
                            type: 'feishu',
                            name: '飞书',
                            desc: '字节跳动旗下协作平台',
                          },
                        ].map((platform) => {
                          const isBound = thirdPartyData.some(
                            (item) => item.authType === platform.type,
                          );
                          if (isBound) return null;

                          return (
                            <div
                              key={platform.type}
                              className={`bind-card ${platform.type}`}
                              onClick={() => {
                                if (platform.type === 'github')
                                  handleBindGitHub();
                                else if (platform.type === 'gitee')
                                  handleBindGitee();
                                else if (platform.type === 'gitlab')
                                  handleBindGitLab();
                                else if (platform.type === 'feishu')
                                  handleBindFeiShu();
                              }}
                            >
                              <div className="bind-card-icon">
                                {platform.type === 'github' && (
                                  <MyIcon type={'icon-github'} />
                                )}
                                {platform.type === 'gitee' && (
                                  <MyIcon type={'icon-gitee'} />
                                )}
                                {platform.type === 'gitlab' && (
                                  <MyIcon type={'icon-gitlab'} />
                                )}
                                {platform.type === 'feishu' && (
                                  <MyIcon type={'icon-feishu'} />
                                )}
                              </div>
                              <div className="bind-card-content">
                                <div className="bind-card-name">
                                  {platform.name}
                                </div>
                                <div className="bind-card-desc">
                                  {platform.desc}
                                </div>
                              </div>
                              <div className="bind-card-action">
                                <Button type="primary" size="small" ghost>
                                  立即绑定
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                }
              })()}
            </div>
          </ProCard>

          <ProCard
            title={
              <div>
                <span className="title-icon">
                  <SettingOutlined />
                </span>
                系统设置
                <Tooltip
                  title="调整系统主题、布局和显示偏好"
                  style={{ marginLeft: 8 }}
                >
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </div>
            }
            bordered
            headerBordered
            className="setting-card system-setting-card"
          >
            <div className="system-setting-content">
              <div className="setting-description">
                <p>个性化您的使用体验，调整系统外观和布局设置</p>
              </div>

              <div className="setting-options">
                <div className="setting-item">
                  <div className="setting-item-info">
                    <div className="setting-item-title">
                      <SettingOutlined
                        style={{ marginRight: 8, color: '#1890ff' }}
                      />
                      主题与布局设置
                    </div>
                    <div className="setting-item-desc">
                      调整系统主题色彩、明暗模式、菜单布局等显示选项
                    </div>
                  </div>
                  <div className="setting-item-action">
                    <Button
                      type="primary"
                      onClick={() => setSettingsVisible(true)}
                      icon={<SettingOutlined />}
                    >
                      打开设置
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ProCard>

          <ProCard
            title={
              <div>
                <span className="title-icon">
                  <WarningOutlined />
                </span>
                账号注销
                <Tooltip
                  title="账号注销后账户所有数据将被销毁，请谨慎操作"
                  style={{ marginLeft: 8 }}
                >
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </div>
            }
            bordered
            headerBordered
            className="setting-card danger-card"
          >
            <Alert
              message="注销〖鲸鱼〗帐号是不可恢复的操作，你应自行备份〖鲸鱼〗帐号相关的信息和数据。注销帐号后你将丢失该帐号自注册以来产生的数据和记录，注销后相关数据将不可恢复。"
              type="error"
              showIcon
              style={{
                marginTop: 15,
                border: '1px solid #ffe58f',
                borderRadius: 4,
              }}
              action={
                <Button
                  size="small"
                  danger
                  onClick={() => {
                    setDestroyVisible(true);
                  }}
                >
                  注销
                </Button>
              }
            />
          </ProCard>
        </ProCard>
      </ProCard>

      <ModalForm
        title={modalSteps[currentField]?.[currentStep - 1]?.title}
        open={visible}
        width={500}
        modalProps={{
          closable: true,
          onCancel: () => {
            setVisible(false);
            setCurrentStep(1);
          },
          maskClosable: false,
        }}
        submitter={{
          render: (props, values) => {
            return [
              <Button
                key="no"
                onClick={() => {
                  setVisible(false);
                  setCurrentStep(1);
                }}
              >
                取消
              </Button>,
              <Button
                key="ok"
                type={'primary'}
                onClick={() => {
                  props.submit();
                }}
              >
                {currentField === 'password'
                  ? '确认'
                  : currentStep === 1
                    ? '下一步'
                    : '确认'}
              </Button>,
            ];
          },
        }}
        initialValues={{
          phone: userInfo.phone,
          email: userInfo.email,
        }}
        layout="vertical"
        onFinish={handleSubmit}
        form={form}
      >
        {modalSteps[currentField]?.[currentStep - 1]?.content}
      </ModalForm>

      <ModalForm
        title="账号安全验证"
        open={destroyVisible}
        width={500}
        modalProps={{
          closable: true,
          onCancel: () => {
            setDestroyVisible(false);
          },
          maskClosable: false,
        }}
        layout="vertical"
        onFinish={(values) => deleteAccount(values)}
        form={form}
      >
        <Alert
          message={
            <Marquee pauseOnHover gradient={false}>
              您正在进行敏感操作，输入密码以验证您的身份，验证通过后可以注销此账号。&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </Marquee>
          }
          type="error"
          showIcon
          style={{
            marginTop: 20,
            border: '1px solid #ffe58f',
            borderRadius: 4,
          }}
        />
        <ProFormItem style={{ marginTop: 20 }}>
          <ProFormText.Password
            name="password"
            label={
              <label>
                密码&nbsp;
                <Tooltip
                  color={'yellow'}
                  title={
                    <a
                      href="http://www.beian.gov.cn"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#000000' }}
                    >
                      忘记密码？点此查看
                    </a>
                  }
                >
                  <QuestionCircleOutlined style={{ color: 'green' }} />
                </Tooltip>
              </label>
            }
            rules={[{ required: true, message: '请输入密码' }]}
            fieldProps={{
              prefix: <LockOutlined />,
            }}
          />
        </ProFormItem>
      </ModalForm>

      {/* 系统设置抽屉 */}
      <SettingDrawer
        pathname={location.pathname}
        enableDarkTheme
        getContainer={false}
        settings={initialState?.settings}
        onSettingChange={(changeSetting) => {
          setInitialState((preInitialState) => ({
            ...preInitialState,
            settings: {
              ...preInitialState?.settings,
              ...changeSetting,
            },
          }));
        }}
        disableUrlParams={false}
        hideHintAlert
        hideCopyButton
        onClose={() => setSettingsVisible(false)}
        open={settingsVisible}
      />
    </PageContainer>
  );
};

export default withAuth(SettingPage);
