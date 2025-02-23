import {history} from "umi";
import buildMenu from "@/utils/buildMenu";
import {getToken, removeToken, removeUsername} from "@/utils/tokenUtil";
import {AVATAR, LOGIN_PATH, LOGO, TITLE} from "@/config";
import message from "antd/es/message";
import {Dropdown} from "antd";
import {LogoutOutlined} from "@ant-design/icons";
import {DefaultFooter} from "@ant-design/pro-components";

const defaultInitialState = {
  currentUser: {name: '临时用户'},
  settings: {
    layout: "mix",
    contentWidth: "Fluid",
    splitMenus: true,
    siderMenuType: "sub",
    fixedHeader: true,
    fixSiderbar: true,
    siderWidth: 208,
    navTheme: "light",
    colorPrimary: "#1677FF",
    colorWeak: false,
  },
  menuData: [],
  routeList: []
}

export async function getInitialState() {
  // 未认证
  if (!getToken()) {
    // 当前页为登录页
    if (history.location.pathname === LOGIN_PATH) {
      return defaultInitialState
    }
    message.warning('未登录')
    history.push(LOGIN_PATH)
    return defaultInitialState
  }
  // TODO: 实际使用时，需调用 lakers系统的菜单接口
  // const {success, data} = await LakersApi.getMenu(getToken())
  const {success, data} = {
    data: [
      {
        text: '欢迎',
        route: '/welcome',
        rank: 0
      },
    ],
    success: true
  }
  if (success && data.length > 0) {
    let {menuData, routeList} = buildMenu(data)
    return {
      ...defaultInitialState,
      menuData,
      routeList
    }
  }
  return defaultInitialState
}

export const layout = ({initialState}) => {
  return {
    title: TITLE,
    logo: LOGO,
    avatarProps: {
      src: AVATAR,
      shape: "square",
      title: initialState?.currentUser.name,
      render: (props, dom) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "logout",
                  icon: <LogoutOutlined/>,
                  label: "退出登录",
                  onClick: () => {
                    removeToken();
                    removeUsername();
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
      return <DefaultFooter copyright={`${new Date().getFullYear()}`}/>;
    },
    waterMarkProps: {
      width: 120,
      height: 64,
      rotate: -22,
      zIndex: 9,
      content: initialState?.currentUser.name,
      fontColor: "rgba(0,0,0,.15)",
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "sans-serif",
      fontStyle: "normal",
    },
    ...initialState?.settings,
  };
}
