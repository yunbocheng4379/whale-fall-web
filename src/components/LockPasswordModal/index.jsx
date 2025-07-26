import { LOCK_SCREEN_PATH } from '@/config';
import { MyIcon } from '@/utils/iconUtil';
import {
  isDevToolsOpen,
  setLockPassword,
  setLockStatus,
} from '@/utils/lockScreenUtil';
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { history } from 'umi';

const LockPasswordModal = ({ open, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      // 检查是否开启了开发者模式
      if (isDevToolsOpen()) {
        message.warning('请先关闭开发者模式，然后重新尝试锁定屏幕');
        onCancel();
        return;
      }

      // 重置表单
      form.resetFields();

      // 延迟聚焦到密码输入框
      setTimeout(() => {
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }, 100);
    }
  }, [open, form, onCancel]);

  const handleSubmit = async (values) => {
    const { password, confirmPassword } = values;

    if (password !== confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    if (password.length < 4) {
      message.error('密码长度至少为4位');
      return;
    }

    setLoading(true);

    try {
      // 再次检查开发者模式
      if (isDevToolsOpen()) {
        message.warning('检测到开发者模式已开启，请关闭后重试');
        setLoading(false);
        return;
      }

      // 保存加密密码
      setLockPassword(password);

      // 设置锁屏状态
      setLockStatus(true);

      message.success('锁屏密码设置成功，即将跳转到锁屏界面');

      // 跳转到锁屏页面
      setTimeout(() => {
        history.push(LOCK_SCREEN_PATH);
        onCancel();
      }, 1000);
    } catch (error) {
      console.error('设置锁屏密码失败:', error);
      message.error('设置锁屏密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <MyIcon type="icon-lock" style={{ fontSize: 18, color: '#1677FF' }} />
          <span>设置锁屏密码</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      maskClosable={false}
      destroyOnClose
      styles={{
        body: {
          padding: '24px',
        },
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            fontSize: 48,
            color: '#1677FF',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <MyIcon type="icon-lock" />
        </div>
        <p
          style={{
            color: '#666',
            fontSize: 14,
            margin: 0,
            lineHeight: '20px',
          }}
        >
          请设置锁屏密码，密码将被加密存储到本地
          <br />
          <span style={{ color: '#ff4d4f' }}>注意：请确保已关闭开发者模式</span>
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="password"
          label="锁屏密码"
          rules={[
            { required: true, message: '请输入锁屏密码' },
            { min: 4, message: '密码长度至少为4位' },
            { max: 20, message: '密码长度不能超过20位' },
          ]}
        >
          <Input.Password
            ref={passwordInputRef}
            prefix={<LockOutlined style={{ color: '#1677FF' }} />}
            placeholder="请输入锁屏密码（4-20位）"
            size="large"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            style={{
              borderRadius: 8,
            }}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          rules={[
            { required: true, message: '请确认锁屏密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#1677FF' }} />}
            placeholder="请再次输入锁屏密码"
            size="large"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            style={{
              borderRadius: 8,
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
          <Space style={{ width: '100%', justifyContent: 'center' }} size={16}>
            <Button
              onClick={handleCancel}
              size="large"
              style={{
                borderRadius: 8,
                minWidth: 100,
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                borderRadius: 8,
                minWidth: 100,
                background: '#1677FF',
              }}
            >
              确认锁定
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LockPasswordModal;
