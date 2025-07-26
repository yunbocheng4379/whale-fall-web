import { LOCK_SCREEN_PATH } from '@/config';
import { handleKeyDown, isLocked, setLockStatus } from '@/utils/lockScreenUtil';
import { useEffect, useState } from 'react';
import { history } from 'umi';

/**
 * 锁屏状态管理Hook
 */
export const useLockScreen = () => {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    // 初始化锁屏状态
    const checkLockStatus = () => {
      const lockStatus = isLocked();
      setLocked(lockStatus);

      // 如果处于锁屏状态且不在锁屏页面，跳转到锁屏页面
      if (lockStatus && history.location.pathname !== LOCK_SCREEN_PATH) {
        history.push(LOCK_SCREEN_PATH);
      }
    };

    checkLockStatus();

    // 监听存储变化
    const handleStorageChange = (e) => {
      if (e.key === 'LOCK_STATUS') {
        checkLockStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 添加键盘事件监听
    const handleKeyDownEvent = (e) => {
      if (locked) {
        handleKeyDown(e);
      }
    };

    document.addEventListener('keydown', handleKeyDownEvent, true);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('keydown', handleKeyDownEvent, true);
    };
  }, [locked]);

  // 锁定屏幕
  const lockScreen = () => {
    setLockStatus(true);
    setLocked(true);
    history.push(LOCK_SCREEN_PATH);
  };

  // 解锁屏幕
  const unlockScreen = () => {
    setLockStatus(false);
    setLocked(false);
  };

  return {
    locked,
    lockScreen,
    unlockScreen,
    isLocked: () => isLocked(),
  };
};
