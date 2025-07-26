import { LOCK_PASSWORD_KEY, LOCK_STATUS_KEY } from '@/config';
import { encrypt, verifyPassword } from '@/utils/cryptoUtil';

/**
 * 获取锁屏密码（加密存储）
 * @returns {string|null} 锁屏密码
 */
export function getLockPassword() {
  try {
    return localStorage.getItem(LOCK_PASSWORD_KEY);
  } catch (error) {
    console.warn('读取锁屏密码失败:', error);
    return null;
  }
}

/**
 * 设置锁屏密码（加密存储）
 * @param {string} password 锁屏密码
 */
export function setLockPassword(password) {
  try {
    const encryptedPassword = encrypt(password);
    localStorage.setItem(LOCK_PASSWORD_KEY, encryptedPassword);
  } catch (error) {
    console.warn('设置锁屏密码失败:', error);
  }
}

/**
 * 移除锁屏密码
 */
export function removeLockPassword() {
  try {
    localStorage.removeItem(LOCK_PASSWORD_KEY);
    localStorage.removeItem(LOCK_STATUS_KEY);
  } catch (error) {
    console.warn('删除锁屏密码失败:', error);
  }
}

/**
 * 检查是否已设置锁屏密码
 * @returns {boolean} 是否已设置锁屏密码
 */
export function hasLockPassword() {
  const password = getLockPassword();
  return password !== null && password !== '';
}

/**
 * 验证锁屏密码
 * @param {string} inputPassword 输入的密码
 * @returns {boolean} 密码是否正确
 */
export function verifyLockPassword(inputPassword) {
  try {
    if (!inputPassword) {
      return false;
    }

    const storedPassword = getLockPassword();
    if (!storedPassword) {
      return false;
    }

    const isValid = verifyPassword(inputPassword, storedPassword);
    return isValid;
  } catch (error) {
    console.error('验证锁屏密码时发生错误:', error);
    return false;
  }
}

/**
 * 设置锁屏状态
 * @param {boolean} locked 是否锁定
 */
export function setLockStatus(locked) {
  try {
    localStorage.setItem(LOCK_STATUS_KEY, locked ? '1' : '0');
  } catch (error) {
    console.warn('设置锁屏状态失败:', error);
  }
}

/**
 * 获取锁屏状态
 * @returns {boolean} 是否处于锁屏状态
 */
export function getLockStatus() {
  try {
    return localStorage.getItem(LOCK_STATUS_KEY) === '1';
  } catch (error) {
    console.warn('读取锁屏状态失败:', error);
    return false;
  }
}

/**
 * 检查是否处于锁屏状态
 * @returns {boolean} 是否处于锁屏状态
 */
export function isLocked() {
  return getLockStatus() && hasLockPassword();
}

/**
 * 检测开发者工具是否打开
 * @returns {boolean} 开发者工具是否打开
 */
export function isDevToolsOpen() {
  const threshold = 160;

  // 检测窗口尺寸变化
  if (
    window.outerHeight - window.innerHeight > threshold ||
    window.outerWidth - window.innerWidth > threshold
  ) {
    return true;
  }

  // 检测console.log时间差异
  let devtools = { open: false, orientation: null };
  const element = new Image();

  element.__defineGetter__('id', function () {
    devtools.open = true;
  });

  console.log('%c', element);
  console.clear();

  return devtools.open;
}

/**
 * 禁用键盘快捷键的事件处理函数
 * @param {KeyboardEvent} e 键盘事件
 * @returns {boolean} 是否阻止默认行为
 */
export function handleKeyDown(e) {
  if (!isLocked()) return true;

  // 禁用 F12
  if (e.key === 'F12') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+Shift+I/J/C/K (开发者工具)
  if (e.ctrlKey && e.shiftKey) {
    const key = e.key.toLowerCase();
    if (['i', 'j', 'c', 'k'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  // 禁用 Ctrl+U (查看源代码)
  if (e.ctrlKey && e.key.toLowerCase() === 'u') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+S (保存页面)
  if (e.ctrlKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+A (全选)
  if (e.ctrlKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+P (打印)
  if (e.ctrlKey && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+F (查找)
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Alt+Tab (切换窗口)
  if (e.altKey && e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+Tab (切换标签页)
  if (e.ctrlKey && e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+W (关闭标签页)
  if (e.ctrlKey && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+R 和 F5 (刷新页面)
  if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // 禁用 Ctrl+Shift+R (强制刷新)
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  return true;
}
