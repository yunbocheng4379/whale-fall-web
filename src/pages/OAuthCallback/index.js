import LoginApi from '@/api/LoginApi';
import buildMenu from '@/utils/buildMenu';
import { removeToken, setToken, setUsername } from '@/utils/tokenUtil';
import { message } from 'antd';
import { useEffect } from 'react';
import { history, useLocation, useModel } from 'umi';

const OAuthCallback = () => {
  const { setInitialState } = useModel('@@initialState');
  const location = useLocation();
  const handleAuth = async (token, username) => {
    if (!token || !username) {
      message.warning('授权参数缺失');
      removeToken();
      history.replace('/login');
    } else {
      setToken(token);
      setUsername(username);
      const { success, data } = await LoginApi.getMenu(username);
      console.log(success);
      if (!success) message.warning('获取菜单失败');
      await setInitialState((initialState) => ({
        ...initialState,
        currentUser: { name: username },
        menuData: buildMenu(data.data).menuData,
        routeList: buildMenu(data.data).routeList,
      }));
      message.success('欢迎回来');
      history.replace('/home');
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const username = queryParams.get('username');

    handleAuth(token, username).then(() => {});
  }, [location.search, setInitialState]);

  return <></>;
};

export default OAuthCallback;
