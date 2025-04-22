import AccountApi from '@/api/AccountApi';
import { withAuth } from '@/components/Auth';
import { LOGIN_PATH } from '@/config';
import useCountdown from '@/hooks/useCountdown';
import { removeAvatarUrl } from '@/utils/storage';
import {
  getUsername,
  removeToken,
  removeUsername,
  removeUserRole,
} from '@/utils/tokenUtil';
import {
  LockOutlined,
  MailOutlined,
  NumberOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProForm,
  ProFormCaptcha,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, Button, Form, Input, message, Space, Tag, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { history } from 'umi';

const SettingPage = () => {
  const [userInfo, setUserInfo] = useState({});
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentField, setCurrentField] = useState('');
  const {
    countdown: captchaCountdown,
    start: startCountdown,
    reset: resetCountdown,
  } = useCountdown();
  const [lastCaptchaType, setLastCaptchaType] = useState('');
  const [thirdPartyData, setThirdPartyData] = useState([]);
  const [oldEmail, setOldEmail] = useState('');
  const [oldPhone, setOldPhone] = useState('');
  const [form] = Form.useForm();

  const handleSwitchLoginType = (type) => {
    if (type !== lastCaptchaType) {
      resetCountdown();
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
      setUserInfo({
        avatarUrl: userInfo?.avatarUrl,
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

  useEffect(() => {
    fetchUserInfo().then((r) => {});
  }, []);

  // 处理验证码发送
  const handleSendCode = async () => {
    try {
      await updateAccountInfo({
        type: 'send_verify_code',
        field: currentField,
        account: userInfo.username,
      });
      message.success('验证码已发送至您的原联系方式');
      setCountdown(60);
    } catch (error) {
      message.error(error.message || '验证码发送失败');
    }
  };

  // 处理表单提交
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
          fetchUserInfo().then((r) => {});
          setVisible(false);
          setCurrentStep(1);
        }
      }
    } else {
      // 密码提交
      await updateAccountInfo(payload);
      message.success('密码修改成功，请重新登录');
      removeToken();
      removeUsername();
      removeUserRole();
      removeAvatarUrl();
      history.push(LOGIN_PATH);
    }
    const payload = {
      ...values,
      type: currentField,
      account: userInfo.username,
    };
  };

  // 打开修改弹窗
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
                message="更换号码后，你将无法通过 【原手机号+验证码】登录"
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
              message="更换手机号后，你将通过 【新手机号+验证码】登录，【旧手机号】将失效"
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
                message="更换邮箱后，你将无法通过 【原邮箱+验证码】登录"
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
              message="更换邮箱后，你将通过 【新邮箱+验证码】登录，【旧邮箱】将失效"
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
            <ProFormText.Password
              name="oldPassword"
              label="原密码"
              rules={[{ required: true, message: '请输入原密码' }]}
              fieldProps={{
                prefix: <LockOutlined />,
              }}
            />
            <ProFormText.Password
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 8, message: '至少8位字符' },
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

  return (
    <PageContainer title={false} header={{ title: '账号设置' }}>
      <ProCard direction="column" gutter={[24]}>
        <ProCard bordered>
          <ProForm submitter={false}>
            <ProFormText
              label="手机号码"
              fieldProps={{
                value: userInfo.phone,
                readOnly: true,
                suffix: (
                  <Button type="link" onClick={() => showModifyModal('phone')}>
                    更换号码
                  </Button>
                ),
              }}
            />
          </ProForm>
        </ProCard>

        <ProCard bordered>
          <ProForm submitter={false}>
            <ProFormText
              label="邮箱"
              fieldProps={{
                value: userInfo.email,
                readOnly: true,
                suffix: (
                  <Button type="link" onClick={() => showModifyModal('email')}>
                    更换邮箱
                  </Button>
                ),
              }}
            />
          </ProForm>
        </ProCard>

        <ProCard bordered>
          <ProForm submitter={false}>
            <ProFormText
              label="登录密码"
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
        </ProCard>

        <ModalForm
          title={modalSteps[currentField]?.[currentStep - 1]?.title}
          open={visible}
          width={600}
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

        {/* 第三方账号绑定区块 */}
        <ProCard
          title={
            <>
              <Space>
                <div>
                  <b>第三方账号绑定</b>
                </div>
                <Tooltip title="三方账号绑定信息，可进行三方账号信息绑定、解除关联">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
              <div style={{ marginTop: 20 }}>
                使用以下任一方式都可以登录到您的账号，避免由于某个账号失效导致无法登录
              </div>
            </>
          }
          bordered
          headerBordered
          style={{ borderRadius: 8 }}
        >
          <ProTable
            dataSource={thirdPartyData}
            rowKey="key"
            search={false}
            toolBarRender={false}
            pagination={false}
            columns={[
              {
                title: '平台名称',
                dataIndex: 'authType',
                width: 120,
                render: (text) => <strong>{text}</strong>,
              },
              {
                title: '绑定账号',
                dataIndex: 'authName',
                width: 120,
                render: (text) => <strong>{text}</strong>,
              },
              {
                title: '绑定状态',
                dataIndex: 'flag',
                width: 100,
                render: (flag) => (
                  <Tag color={flag ? 'success' : 'default'}>
                    {flag ? '已绑定' : '未绑定'}
                  </Tag>
                ),
              },
              {
                title: '绑定时间',
                dataIndex: 'createTime',
                width: 150,
              },
              {
                title: '操作',
                width: 120,
                render: (_, record) => (
                  <Space>
                    {record.flag ? (
                      <Button
                        danger
                        size="small"
                        onClick={() => handleBindUnbind(record.platform)}
                      >
                        解绑
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleBindUnbind(record.platform)}
                      >
                        绑定
                      </Button>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};

export default withAuth(SettingPage);
