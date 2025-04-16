import LoginApi from '@/api/LoginApi';
import buildMenu from '@/utils/buildMenu';
import { getCounter } from '@/utils/storage';
import {
  removeToken,
  removeUsername,
  removeUserRole,
  setToken,
  setUsername,
  setUserRole,
} from '@/utils/tokenUtil';
import { message } from 'antd';
import { useEffect } from 'react';
import { history, useLocation, useModel } from 'umi';

const OAuthCallback = () => {
  const { setInitialState } = useModel('@@initialState');
  const location = useLocation();
  const handleAuth = async (token, username, role) => {
    if (!token || !username || !role) {
      message.warning('授权参数缺失');
      removeToken();
      removeUsername();
      removeUserRole();
      history.replace('/login');
    } else {
      setToken(token);
      setUsername(username);
      setUserRole(role);
      const { success, data } = await LoginApi.getMenu({
        userName: username,
        menuType: getCounter(),
      });
      if (!success) message.warning('获取菜单失败');
      await setInitialState((initialState) => ({
        ...initialState,
        currentUser: { name: username },
        menuData: buildMenu(data.data).menuData,
        routeList: buildMenu(data.data).routeList,
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
    if (error !== null) {
      message.warning(error);
      history.replace('/login');
    } else {
      handleAuth(token, username, role).then(() => {});
    }
  }, [location.search, setInitialState]);

  return <></>;
};

export default OAuthCallback;
