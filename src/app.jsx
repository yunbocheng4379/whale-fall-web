import LoginApi from '@/api/LoginApi';
import FlowerEffect from '@/components/FlowerEffect';
import HeaderWrapper from '@/components/HeaderWrapper';
import { preloadLockScreenResources } from '@/utils/lockScreenPreloader';
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
import { history } from 'umi';
import React, { useState, useEffect } from 'react';

// 导入警告抑制器（抑制已知的第三方库警告）
import '@/utils/suppressWarnings';
import message from 'antd/es/message';

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

// 全局放花效果状态管理
let flowerEffectActive = false;
let setFlowerEffectCallback = null;

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

// 放花效果包装组件
const FlowerEffectWrapper = () => {
  const [active, setActive] = useState(false);

  // 设置全局回调
  React.useEffect(() => {
    setFlowerEffectCallback = setActive;
  }, []);

  const handleComplete = () => {
    setActive(false);
  };

  return (
    <FlowerEffect
      active={active}
      onComplete={handleComplete}
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
  // 预加载锁屏资源（不阻塞应用启动）
  preloadLockScreenResources().catch(error => {
    console.warn('锁屏资源预加载失败:', error);
  });

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
        removeEmail()
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
        return <HeaderWrapper childrenMenuList={childrenMenuList} />;
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
