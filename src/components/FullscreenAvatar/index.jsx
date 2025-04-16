import { useFullscreen } from '@/hooks/useFullscreen';
import { CompressOutlined, ExpandOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

const FullscreenAvatar = () => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <Tooltip
        title={isFullscreen ? '退出全屏' : '进入全屏'}
        placement="bottom"
      >
        <Button
          type="text"
          onClick={toggleFullscreen}
          style={{
            padding: 0,
            height: 'auto',
            color: 'inherit',
          }}
          className="custom-fullscreen-btn"
        >
          {isFullscreen ? (
            <CompressOutlined style={{ fontSize: 20 }} />
          ) : (
            <ExpandOutlined style={{ fontSize: 20 }} />
          )}
        </Button>
      </Tooltip>
    </div>
  );
};

export default FullscreenAvatar;
