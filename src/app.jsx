import LoginApi from '@/api/LoginApi';
import DailyMessageButton from '@/components/DailyMessageButton';
import FullscreenAvatar from '@/components/FullscreenAvatar';
import LockPasswordModal from '@/components/LockPasswordModal';
import SearchMenu from '@/components/SearchMenu';
import {
  CALLBACK_PATH,
  HOME_PATH,
  LOGIN_PATH,
  LOCK_SCREEN_PATH,
  LOGO,
  SETTING_PATH,
  TITLE,
} from '@/config';
import '@/styles/headerButtons.less';
import buildMenu from '@/utils/buildMenu';
import { MyIcon } from '@/utils/iconUtil';
import { isLocked, handleKeyDown } from '@/utils/lockScreenUtil';
import {
  getAvatarUrl,
  getCounter,
  removeAvatarUrl,
  setCounter,
} from '@/utils/storage';
import {
  getToken,
  getUsername,
  getUserRole,
  removeToken,
  removeUsername,
  removeUserRole,
} from '@/utils/tokenUtil';
import { DefaultFooter } from '@ant-design/pro-components';
import { Dropdown } from 'antd';
import message from 'antd/es/message';
import { history } from 'umi';
import React, { useState, useEffect } from 'react';

// 导入警告抑制器（抑制已知的第三方库警告）
import '@/utils/suppressWarnings';

const defaultInitialState = {
  currentUser: { name: '临时用户' },
  settings: {
    layout: 'mix',
    contentWidth: 'Fluid',
    splitMenus: true,
    siderMenuType: 'sub',
    fixedHeader: true,
    fixSiderbar: true,
    siderWidth: 208,
    navTheme: 'light',
    colorPrimary: '#1677FF',
    colorWeak: false,
  },
  menuData: [],
  routeList: [],
};

let rootMenuList = [];
let childrenMenuList = [];

// 全局状态管理锁屏模态框
let setLockPasswordModalOpenCallback = null;

// 全局键盘事件监听器
let keyboardListenerAdded = false;

const addGlobalKeyboardListener = () => {
  if (!keyboardListenerAdded) {
    const handleKeyDownEvent = (e) => {
      handleKeyDown(e);
    };
    document.addEventListener('keydown', handleKeyDownEvent, true);
    keyboardListenerAdded = true;
  }
};

// 锁屏模态框组件
const LockScreenModalWrapper = () => {
  const [modalOpen, setModalOpen] = useState(false);

  // 设置全局回调
  React.useEffect(() => {
    setLockPasswordModalOpenCallback = setModalOpen;
    addGlobalKeyboardListener();
  }, []);

  return (
    <LockPasswordModal
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
    />
  );
};

const getRootMenuAndChildrenMenu = (menuList) => {
  menuList.forEach((menu) => {
    if (menu.children)
      childrenMenuList.push({
        name: menu?.text,
        path: menu?.route,
        icon: menu?.icon,
      });
    if (!menu.children)
      return childrenMenuList.push({
        name: menu?.text,
        path: menu?.route,
        icon: menu?.icon,
      });
    return getRootMenuAndChildrenMenu(menu.children);
  });
};

export async function getInitialState() {
  // 检查是否处于锁屏状态
  if (isLocked()) {
    // 如果当前不在锁屏页面，跳转到锁屏页面
    const currentPath = history.location.pathname;
    if (currentPath !== LOCK_SCREEN_PATH) {
      history.push(LOCK_SCREEN_PATH);
    }
  }

  // 未认证
  if (!getToken()) {
    // 当前页为登录页
    let path = history.location.pathname;
    if (path === LOGIN_PATH) {
      message.warning('未登录，请重新登录');
    } else {
      if (path !== CALLBACK_PATH && path !== LOCK_SCREEN_PATH) {
        removeUsername();
        removeUserRole();
        removeAvatarUrl();
        message.warning('账号身份已过期，请重新登录');
      }
    }
    return defaultInitialState;
  }
  const { success, data } = await LoginApi.getMenu({
    userName: getUsername(),
    menuType: getCounter(),
  });
  const menuList = data.data;
  getRootMenuAndChildrenMenu(menuList);
  if (success && menuList.length > 0) {
    let { menuData, routeList } = buildMenu(menuList);
    return {
      ...defaultInitialState,
      currentUser: { name: getUsername() || '非法昵称' },
      menuData,
      routeList,
    };
  }
  return defaultInitialState;
}

export const layout = ({ initialState }) => {

  return {
    title: TITLE,
    logo: LOGO,
    avatarProps: {
      src: getAvatarUrl(),
      shape: 'square',
      title: initialState?.currentUser.name,
      render: (props, dom) => {
        return (
          <>
            <div className="header-button-item search-menu-button">
              <SearchMenu menuData={childrenMenuList} />
            </div>
            <div className="header-button-item message-button">
              <DailyMessageButton />
            </div>
            <div className="header-button-item avatar-button">
              <FullscreenAvatar />
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'flowering',
                    icon: (
                      <MyIcon type={'icon-firework'} style={{ fontSize: 20 }} />
                    ),
                    label: '劈里啪啦',
                    onClick: () => {
                      message.success('放花咯').then((r) => {});
                    },
                  },
                  {
                    key: 'settings',
                    icon: (
                      <MyIcon type={'icon-settings'} style={{ fontSize: 20 }} />
                    ),
                    label: '账号设置',
                    onClick: () => {
                      history.push(SETTING_PATH);
                    },
                  },
                  //管理员可以看到后台管理
                  getUserRole() === 'ADMINISTRATOR_USER'
                    ? getCounter() === 0
                      ? {
                          key: 'management',
                          icon: (
                            <MyIcon
                              type={'icon-system'}
                              style={{ fontSize: 20 }}
                            />
                          ),
                          label: '后台管理',
                          onClick: () => {
                            setCounter(1);
                            history.push(HOME_PATH);
                            location.reload();
                          },
                        }
                      : {
                          key: 'business',
                          icon: (
                            <MyIcon
                              type={'icon-business'}
                              style={{ fontSize: 20 }}
                            />
                          ),
                          label: '业务系统',
                          onClick: () => {
                            setCounter(0);
                            history.push(HOME_PATH);
                            location.reload();
                          },
                        }
                    : null,
                  {
                    key: 'logout',
                    icon: (
                      <MyIcon type={'icon-tuichu'} style={{ fontSize: 20 }} />
                    ),
                    label: '退出登录',
                    onClick: () => {
                      removeToken();
                      removeUsername();
                      removeUserRole();
                      removeAvatarUrl();
                      setCounter(0);
                      message.success('退出成功').then((r) => {});
                      history.push(LOGIN_PATH);
                    },
                  },
                  {
                    key: 'lockScreen',
                    icon: (
                      <MyIcon type={'icon-lock'} style={{ fontSize: 20 }} />
                    ),
                    label: '锁定屏幕',
                    onClick: () => {
                      if (setLockPasswordModalOpenCallback) {
                        setLockPasswordModalOpenCallback(true);
                      }
                    },
                  },
                ],
              }}
            >
              {dom}
            </Dropdown>

            {/* 锁屏密码设置Modal */}
            <LockScreenModalWrapper />
          </>
        );
      },
    },
    menuFooterRender: (props) => {
      if (props?.collapsed) return false;
      return (
        <DefaultFooter copyright={`${new Date().getFullYear()} ${TITLE}`} />
      );
    },
    waterMarkProps: {
      width: 120,
      height: 64,
      rotate: -22,
      zIndex: 9,
      content: initialState?.currentUser.name,
      fontColor: 'rgba(0,0,0,.15)',
      fontSize: 16,
      fontWeight: 'normal',
      fontFamily: 'sans-serif',
      fontStyle: 'normal',
    },
    ...initialState?.settings,
    onMenuHeaderClick: () => {
      console.log(initialState);
    },
  };
};
