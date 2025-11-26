import LoginApi from '@/api/LoginApi';
import buildMenu from '@/utils/buildMenu';
import { flattenMenuData } from '@/utils/menuHelper';
import {
  getCounter,
  removeAvatarUrl,
  removeEmail,
  setAvatarUrl,
} from '@/utils/storage';
import {
  removeToken,
  removeUsername,
  removeUserRole,
  setToken,
  setUsername,
  setUserRole,
} from '@/utils/tokenUtil';
import { history, useLocation, useModel } from '@umijs/max';
import { message } from 'antd';
import { useEffect } from 'react';

const OAuthCallback = () => {
  const { setInitialState } = useModel('@@initialState');
  const location = useLocation();

  const handleAuth = async (token, username, role, avatarUrl) => {
    if (!token || !username || !role) {
      message.warning('授权参数缺失');
      removeToken();
      removeUsername();
      removeUserRole();
      removeAvatarUrl();
      removeEmail();
      history.replace('/login');
    } else {
      setToken(token);
      setUsername(username);
      setUserRole(role);
      setAvatarUrl(avatarUrl);
      const { success, data } = await LoginApi.getMenu({
        userName: username,
        menuType: getCounter(),
      });
      if (!success || !data?.data?.length) {
        message.warning('获取菜单失败');
        return;
      }
      const { menuData, routeList } = buildMenu(data.data);
      const searchMenuData = flattenMenuData(data.data);
      await setInitialState((initialState) => ({
        ...initialState,
        currentUser: { name: username },
        menuData,
        routeList,
        searchMenuData,
      }));
      history.replace('/home', { fromLogin: true });
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const error = queryParams.get('error');
    const token = queryParams.get('token');
    const role = queryParams.get('role');
    const username = queryParams.get('username');
    const avatarUrl = queryParams.get('avatarUrl');
    if (error !== null) {
      message.warning(error);
      history.replace('/login');
    } else {
      handleAuth(token, username, role, avatarUrl).then(() => {});
    }
  }, [location.search, setInitialState]);

  return <></>;
};

export default OAuthCallback;
