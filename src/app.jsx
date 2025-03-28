import LoginApi from '@/api/LoginApi';
import { AVATAR, LOGIN_PATH, LOGO, TITLE } from '@/config';
import buildMenu from '@/utils/buildMenu';
import { MyIcon } from '@/utils/iconUtil';
import {
  getToken,
  getUsername,
  removeToken,
  removeUsername,
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
      message.warning('未登录');
      return defaultInitialState;
    }
    return defaultInitialState;
  }
  //从后端获取菜单权限
  const { success, data } = await LoginApi.getMenu(getUsername());
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
                    <MyIcon type={'icon-yanhua'} style={{ fontSize: 20 }} />
                  ),
                  label: '劈里啪啦',
                  onClick: () => {
                    message.success('放花咯');
                  },
                },
                {
                  key: 'logout',
                  icon: (
                    <MyIcon type={'icon-tuichu'} style={{ fontSize: 20 }} />
                  ),
                  label: '退出登录',
                  onClick: () => {
                    removeToken();
                    removeUsername();
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
