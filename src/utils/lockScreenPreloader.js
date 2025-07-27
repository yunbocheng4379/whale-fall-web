/**
 * 锁屏资源预加载工具
 */

let isPreloaded = false;
let preloadPromise = null;

/**
 * 预加载锁屏背景图片
 * @returns {Promise} 预加载完成的 Promise
 */
const preloadLockScreenImage = () => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      console.log('锁屏背景图片预加载完成');
      resolve(img);
    };

    img.onerror = (error) => {
      console.warn('锁屏背景图片预加载失败，但继续执行:', error);
      resolve(null); // 即使失败也 resolve，不阻塞流程
    };

    img.src = '/img/system/lockBackground.png';
  });
};

/**
 * 预加载锁屏相关资源
 * @returns {Promise} 预加载完成的 Promise
 */
export const preloadLockScreenResources = () => {
  if (isPreloaded) {
    return Promise.resolve();
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  console.log('开始预加载锁屏资源...');

  preloadPromise = Promise.all([
    preloadLockScreenImage(),
    // 可以在这里添加其他需要预加载的资源
    // 比如字体、图标等
  ])
    .then(() => {
      isPreloaded = true;
      console.log('锁屏资源预加载完成');
    })
    .catch((error) => {
      console.warn('锁屏资源预加载出现错误，但继续执行:', error);
      isPreloaded = true; // 即使出错也标记为已预加载，避免重复尝试
    });

  return preloadPromise;
};

/**
 * 带预加载的锁屏跳转
 * @param {Function} navigateToLockScreen 跳转到锁屏的函数
 * @param {Function} showLoading 显示加载状态的函数（可选）
 * @param {Function} hideLoading 隐藏加载状态的函数（可选）
 */
export const navigateToLockScreenWithPreload = async (
  navigateToLockScreen,
  showLoading = null,
  hideLoading = null,
) => {
  try {
    // 显示加载状态
    if (showLoading) {
      showLoading('正在准备锁屏界面...');
    }

    // 预加载资源
    await preloadLockScreenResources();

    // 隐藏加载状态
    if (hideLoading) {
      hideLoading();
    }

    // 跳转到锁屏
    navigateToLockScreen();
  } catch (error) {
    console.error('锁屏预加载失败:', error);

    // 即使预加载失败，也要跳转到锁屏
    if (hideLoading) {
      hideLoading();
    }
    navigateToLockScreen();
  }
};

/**
 * 重置预加载状态（用于测试或特殊情况）
 */
export const resetPreloadState = () => {
  isPreloaded = false;
  preloadPromise = null;
};

/**
 * 检查是否已预加载
 * @returns {boolean} 是否已预加载
 */
export const isLockScreenPreloaded = () => {
  return isPreloaded;
};
