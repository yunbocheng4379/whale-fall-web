import { AVATAR, DEFAULT_AVATAR, MENU_TYPE } from '@/config';
function getCounter() {
  try {
    return localStorage.getItem(MENU_TYPE) === null
      ? 0
      : Number(localStorage.getItem(MENU_TYPE));
  } catch (error) {
    console.warn('读取存储失败:', error);
    return 0;
  }
}

function setCounter(value) {
  try {
    localStorage.setItem(MENU_TYPE, value);
  } catch (error) {
    console.warn('设置存储失败:', error);
  }
}

function getAvatarUrl() {
  try {
    return localStorage.getItem(AVATAR) === null
      ? DEFAULT_AVATAR
      : localStorage.getItem(AVATAR);
  } catch (error) {
    console.warn('读取存储失败:', error);
    return 0;
  }
}

function setAvatarUrl(value) {
  try {
    localStorage.setItem(AVATAR, value);
  } catch (error) {
    console.warn('设置存储失败:', error);
  }
}

function removeAvatarUrl() {
  try {
    localStorage.removeItem(AVATAR);
  } catch (error) {
    console.warn('删除存储失败:', error);
  }
}

export { getAvatarUrl, getCounter, removeAvatarUrl, setAvatarUrl, setCounter };
