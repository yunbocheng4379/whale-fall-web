import LoginApi from '@/api/LoginApi';
import FlowerEffect from '@/components/FlowerEffect';
import HeaderWrapper from '@/components/HeaderWrapper';
import {
  CALLBACK_PATH,
  LOCK_SCREEN_PATH,
  LOGIN_PATH,
  LOGO,
  TITLE,
} from '@/config';
import '@/styles/headerButtons.less';
import buildMenu from '@/utils/buildMenu';
import { preloadLockScreenResources } from '@/utils/lockScreenPreloader';
import { handleKeyDown, isLocked } from '@/utils/lockScreenUtil';
import { flattenMenuData } from '@/utils/menuHelper';
import {
  getAvatarUrl,
  getCounter,
  removeAvatarUrl,
  removeEmail,
} from '@/utils/storage';
import {
  getToken,
  getUsername,
  removeUsername,
  removeUserRole,
} from '@/utils/tokenUtil';
import { DefaultFooter } from '@ant-design/pro-components';
import React, { useState } from 'react';
import { history } from 'umi';

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
  searchMenuData: [],
};

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

  return <FlowerEffect active={active} onComplete={handleComplete} />;
};

export async function getInitialState() {
  // 预加载锁屏资源（不阻塞应用启动）
  preloadLockScreenResources().catch((error) => {
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
        removeEmail();
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
  if (success && menuList.length > 0) {
    let { menuData, routeList } = buildMenu(menuList);
    return {
      ...defaultInitialState,
      currentUser: { name: getUsername() || '非法昵称' },
      menuData,
      routeList,
      searchMenuData: flattenMenuData(menuList),
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
      render: () => {
        return (
          <HeaderWrapper
            childrenMenuList={initialState?.searchMenuData || []}
          />
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
