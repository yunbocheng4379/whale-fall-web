import {
  AVATAR,
  DEFAULT_AVATAR,
  DEFAULT_EMAIL,
  EMAIL,
  MENU_TYPE,
} from '@/config';
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
    return localStorage.getItem(AVATAR) === 'undefined'
      ? DEFAULT_AVATAR
      : localStorage.getItem(AVATAR);
  } catch (error) {
    console.warn('读取头像地址失败:', error);
    return 0;
  }
}

function setAvatarUrl(value) {
  try {
    localStorage.setItem(AVATAR, value);
  } catch (error) {
    console.warn('设置头像地址存储失败:', error);
  }
}

function removeAvatarUrl() {
  try {
    localStorage.removeItem(AVATAR);
  } catch (error) {
    console.warn('删除头像地址存储失败:', error);
  }
}

function getEmail() {
  try {
    return localStorage.getItem(EMAIL) === 'undefined'
      ? DEFAULT_EMAIL
      : localStorage.getItem(EMAIL);
  } catch (error) {
    console.warn('读取邮箱失败:', error);
    return 0;
  }
}

function setEmail(value) {
  try {
    localStorage.setItem(EMAIL, value);
  } catch (error) {
    console.warn('设置邮箱存储失败:', error);
  }
}

function removeEmail() {
  try {
    localStorage.removeItem(EMAIL);
  } catch (error) {
    console.warn('删除邮箱存储失败:', error);
  }
}

export {
  getAvatarUrl,
  getCounter,
  getEmail,
  removeAvatarUrl,
  removeEmail,
  setAvatarUrl,
  setCounter,
  setEmail,
};
