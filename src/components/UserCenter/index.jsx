import { HOME_PATH, LOGIN_PATH, SETTING_PATH } from '@/config';
import { MyIcon } from '@/utils/iconUtil';
import { navigateToLockScreenWithPreload } from '@/utils/lockScreenPreloader';
import {
  getAvatarUrl,
  getCounter,
  getEmail,
  removeAvatarUrl,
  removeEmail,
  setCounter,
} from '@/utils/storage';
import {
  getUsername,
  getUserRole,
  removeToken,
  removeUsername,
  removeUserRole,
} from '@/utils/tokenUtil';
import { Avatar, Button, Dropdown, Spin } from 'antd';
import message from 'antd/es/message';
import { useState } from 'react';
import { history } from 'umi';
import './index.less';

const UserCenter = ({ setLockPasswordModalOpenCallback }) => {
  const [isPreloading, setIsPreloading] = useState(false);

  const handleLogout = () => {
    removeToken();
    removeUsername();
    removeUserRole();
    removeAvatarUrl();
    removeEmail();
    setCounter(0);
    message.success('退出成功').then((r) => {});
    history.push(LOGIN_PATH);
  };

  const handleLockScreen = async () => {
    if (setLockPasswordModalOpenCallback) {
      // 使用预加载跳转到锁屏设置
      await navigateToLockScreenWithPreload(
        () => setLockPasswordModalOpenCallback(true),
        (loadingText) => {
          setIsPreloading(true);
          message.loading(loadingText, 0);
        },
        () => {
          setIsPreloading(false);
          message.destroy();
        },
      );
    } else {
      message.error('锁屏功能暂时不可用');
    }
  };

  const menuItems = [
    {
      key: 'flowering',
      icon: <MyIcon type={'icon-firework'} style={{ fontSize: 16 }} />,
      label: '劈里啪啦',
      onClick: () => {
        message.success('放花咯').then((r) => {});
      },
    },
    {
      key: 'settings',
      icon: <MyIcon type={'icon-settings'} style={{ fontSize: 16 }} />,
      label: '账号设置',
      onClick: () => {
        history.push(SETTING_PATH);
      },
    },
    // 管理员可以看到后台管理
    ...(getUserRole() === 'ADMINISTRATOR_USER'
      ? [
          {
            key: getCounter() === 0 ? 'management' : 'business',
            icon: (
              <MyIcon
                type={getCounter() === 0 ? 'icon-system' : 'icon-business'}
                style={{ fontSize: 16 }}
              />
            ),
            label: getCounter() === 0 ? '后台管理' : '业务系统',
            onClick: () => {
              setCounter(getCounter() === 0 ? 1 : 0);
              history.push(HOME_PATH);
              location.reload();
            },
          },
        ]
      : []),
    {
      key: 'lockScreen',
      icon: isPreloading ? (
        <Spin size="small" />
      ) : (
        <MyIcon type={'icon-lock'} style={{ fontSize: 16 }} />
      ),
      label: isPreloading ? '准备中...' : '锁定屏幕',
      onClick: handleLockScreen,
      disabled: isPreloading,
    },
  ];

  const dropdownRender = () => (
    <div className="user-center-dropdown">
      {/* 用户信息头部 */}
      <div className="user-info-header">
        <Avatar src={getAvatarUrl()} size={40} className="user-avatar" />
        <div className="user-details">
          <div className="user-name">{getUsername() || '用户xxx'}</div>
          <div className="user-email">{getEmail()}</div>
        </div>
      </div>

      {/* 菜单项列表 */}
      <div className="menu-items-list">
        {menuItems.map((item) => (
          <div key={item.key} className="menu-item" onClick={item.onClick}>
            <span className="menu-item-icon">{item.icon}</span>
            <span className="menu-item-label">{item.label}</span>
          </div>
        ))}
      </div>

      {/* 退出登录按钮 */}
      <div className="logout-section">
        <Button
          type="text"
          block
          className="logout-button"
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={dropdownRender}
      trigger={['hover']}
      placement="bottomRight"
      overlayClassName="user-center-overlay"
      mouseEnterDelay={0.1}
      mouseLeaveDelay={0.1}
    >
      <Avatar
        src={getAvatarUrl()}
        shape="square"
        className="user-center-trigger"
        style={{ cursor: 'pointer' }}
      />
    </Dropdown>
  );
};

export default UserCenter;
