import LoginApi from '@/api/LoginApi';
import {
  AVATAR,
  HOME_PATH,
  LOGIN_PATH,
  LOGO,
  MENU_TYPE,
  TITLE,
} from '@/config';
import buildMenu from '@/utils/buildMenu';
import { MyIcon } from '@/utils/iconUtil';
import { getCounter, setCounter } from '@/utils/storage';
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

export async function getInitialState() {
  // 未认证
  if (!getToken()) {
    // 当前页为登录页
    if (history.location.pathname === LOGIN_PATH) {
      removeUsername();
      removeUserRole();
      message.warning('账号身份已过期，请重新登录');
      return defaultInitialState;
    }
    return defaultInitialState;
  }
  const { success, data } = await LoginApi.getMenu({
    userName: getUsername(),
    menuType: getCounter(MENU_TYPE),
  });
  const menuList = data.data;
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
      src: AVATAR,
      shape: 'square',
      title: initialState?.currentUser.name,
      render: (props, dom) => {
        return (
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
                    message.success('放花咯');
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
                  : {},
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
                    setCounter(0);
                    message.success('退出成功');
                    history.push(LOGIN_PATH);
                  },
                },
              ],
            }}
          >
            {dom}
          </Dropdown>
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
