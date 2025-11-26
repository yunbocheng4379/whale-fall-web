import DailyMessageButton from '@/components/DailyMessageButton';
import FullscreenAvatar from '@/components/FullscreenAvatar';
import LockPasswordModal from '@/components/LockPasswordModal';
import SearchMenu from '@/components/SearchMenu';
import UserCenter from '@/components/UserCenter';
import { handleKeyDown } from '@/utils/lockScreenUtil';
import React, { useState } from 'react';

// 锁屏模态框组件
const LockScreenModalWrapper = ({ open, onCancel }) => {
  // 添加全局键盘监听器
  React.useEffect(() => {
    const addGlobalKeyboardListener = () => {
      const handleKeyDownEvent = (e) => {
        handleKeyDown(e);
      };
      document.addEventListener('keydown', handleKeyDownEvent, true);
      return () => {
        document.removeEventListener('keydown', handleKeyDownEvent, true);
      };
    };

    const cleanup = addGlobalKeyboardListener();
    return cleanup;
  }, []);

  return <LockPasswordModal open={open} onCancel={onCancel} />;
};

const HeaderWrapper = ({ childrenMenuList = [] }) => {
  // 锁屏模态框状态管理
  const [lockModalOpen, setLockModalOpen] = useState(false);

  return (
    <>
      <div className="header-button-item search-menu-button">
        <SearchMenu menuData={childrenMenuList} />
      </div>
      <div className="header-button-item message-button">
        <DailyMessageButton />
      </div>
      <div className="header-button-item avatar-button">
        <FullscreenAvatar />
      </div>
      <div className="header-button-item user-center-button">
        <UserCenter setLockPasswordModalOpenCallback={setLockModalOpen} />
      </div>

      {/* 锁屏密码设置Modal */}
      <LockScreenModalWrapper
        open={lockModalOpen}
        onCancel={() => setLockModalOpen(false)}
      />
    </>
  );
};

export default HeaderWrapper;
