import { HOME_PATH, LOGIN_PATH } from '@/config';
import { MyIcon } from '@/utils/iconUtil';
import {
  handleKeyDown as lockKeyDown,
  removeLockPassword,
  setLockStatus,
  verifyLockPassword,
} from '@/utils/lockScreenUtil';
import { removeAvatarUrl, removeEmail, setCounter } from '@/utils/storage';
import { removeToken, removeUsername, removeUserRole } from '@/utils/tokenUtil';
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import './index.less';

const LockScreen = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    // 聚焦到密码输入框
    if (passwordInputRef.current && !isBlocked) {
      passwordInputRef.current.focus();
    }

    // 添加键盘事件监听
    const handleKeyDownEvent = (e) => {
      lockKeyDown(e);
    };

    document.addEventListener('keydown', handleKeyDownEvent, true);

    // 禁用右键菜单
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    // 禁用选择文本
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('selectstart', handleSelectStart);

    // 禁用拖拽
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [isBlocked]);

  // 处理阻塞倒计时
  useEffect(() => {
    let timer;
    if (isBlocked && blockTimeLeft > 0) {
      timer = setInterval(() => {
        setBlockTimeLeft((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setErrorCount(0);
            // 重新聚焦到密码输入框
            setTimeout(() => {
              if (passwordInputRef.current) {
                passwordInputRef.current.focus();
              }
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isBlocked, blockTimeLeft]);

  const handleUnlock = async (values) => {
    const { password } = values;

    if (!password) {
      message.error('请输入解锁密码');
      return;
    }

    if (isBlocked) {
      message.warning(`输入错误次数过多，请等待 ${blockTimeLeft} 秒后重试`);
      return;
    }

    setLoading(true);

    try {
      // 验证密码
      const isPasswordCorrect = verifyLockPassword(password);

      if (isPasswordCorrect) {
        // 解锁成功，重置错误计数
        setErrorCount(0);
        setIsBlocked(false);
        setLockStatus(false);
        message.success('解锁成功，正在跳转到首页...');

        // 跳转到首页
        setTimeout(() => {
          history.push(HOME_PATH);
        }, 800);
      } else {
        // 密码错误，增加错误计数
        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);

        if (newErrorCount >= 5) {
          // 错误次数达到5次，阻塞30秒
          setIsBlocked(true);
          setBlockTimeLeft(30);
          message.error('错误次数过多，已锁定30秒');
        } else {
          message.error(`密码错误，还可尝试 ${5 - newErrorCount} 次`);
        }

        // 清空表单
        form.resetFields(['password']);

        // 如果没有被阻塞，重新聚焦到密码输入框
        if (newErrorCount < 5) {
          setTimeout(() => {
            if (passwordInputRef.current) {
              passwordInputRef.current.focus();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('解锁失败:', error);
      message.error('解锁失败，请重试');

      // 清空表单并重新聚焦
      form.resetFields(['password']);
      setTimeout(() => {
        if (passwordInputRef.current && !isBlocked) {
          passwordInputRef.current.focus();
        }
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // 清除所有用户数据
    removeToken();
    removeUsername();
    removeUserRole();
    removeAvatarUrl();
    removeEmail();
    setCounter(0);

    // 清除锁屏密码
    removeLockPassword();

    message.success('退出成功').then((r) => {});

    // 跳转到登录页
    history.push(LOGIN_PATH);
  };

  return (
    <div className="lock-screen-container">
      {/* 背景图片 */}
      <img
        className="background-image"
        src="/img/system/lockBackground.png"
        alt="锁屏背景"
      />

      {/* 锁屏内容 */}
      <div className="lock-screen-content">
        <div className="lock-screen-modal">
          {/* 锁屏图标 */}
          <div className="lock-icon">
            <MyIcon type="icon-lock" />
          </div>

          {/* 标题 */}
          <h2 className="lock-title">屏幕已锁定</h2>
          <p
            className={`lock-subtitle ${isBlocked ? 'blocked' : errorCount > 0 ? 'error' : ''}`}
          >
            {isBlocked
              ? `错误次数过多，请等待 ${blockTimeLeft} 秒后重试`
              : errorCount > 0
                ? `请输入解锁密码（还可尝试 ${5 - errorCount} 次）`
                : '请输入解锁密码继续使用'}
          </p>

          {/* 解锁表单 */}
          <Form
            form={form}
            onFinish={handleUnlock}
            autoComplete="off"
            className="unlock-form"
          >
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入解锁密码' },
                { min: 1, message: '密码不能为空' },
              ]}
              validateTrigger={['onBlur', 'onSubmit']}
            >
              <Input.Password
                ref={passwordInputRef}
                prefix={
                  <LockOutlined
                    style={{ color: isBlocked ? '#ff4d4f' : '#1677FF' }}
                  />
                }
                placeholder={
                  isBlocked ? `请等待 ${blockTimeLeft} 秒` : '请输入解锁密码'
                }
                size="large"
                disabled={isBlocked}
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                onPressEnter={() => {
                  if (!isBlocked) {
                    form
                      .validateFields(['password'])
                      .then(() => {
                        form.submit();
                      })
                      .catch(() => {
                        // 验证失败时重新聚焦
                        setTimeout(() => {
                          if (passwordInputRef.current) {
                            passwordInputRef.current.focus();
                          }
                        }, 100);
                      });
                  }
                }}
                className="unlock-input"
                autoComplete="off"
                spellCheck={false}
                style={{
                  borderColor: errorCount > 0 ? '#ff4d4f' : undefined,
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={isBlocked}
                size="large"
                block
                className="unlock-button"
                style={{
                  background: isBlocked ? '#d9d9d9' : undefined,
                  borderColor: isBlocked ? '#d9d9d9' : undefined,
                }}
              >
                <LockOutlined />
                {isBlocked ? `等待 ${blockTimeLeft} 秒` : '解锁屏幕'}
              </Button>
            </Form.Item>
          </Form>

          {/* 返回登录按钮 */}
          <div className="back-to-login">
            <Button
              type="link"
              onClick={handleBackToLogin}
              className="back-to-login-button"
            >
              <LoginOutlined />
              返回登录
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
