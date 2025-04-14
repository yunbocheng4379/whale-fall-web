import { MENU_TYPE } from '@/config';
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

export { getCounter, setCounter };
