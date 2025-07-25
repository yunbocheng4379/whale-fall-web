import { useFullscreen } from '@/hooks/useFullscreen';
import { CompressOutlined, ExpandOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

const FullscreenAvatar = () => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="custom-fullscreen-btn"
        icon={
          isFullscreen ? (
            <CompressOutlined style={{ fontSize: 18 }} />
          ) : (
            <ExpandOutlined style={{ fontSize: 18 }} />
          )
        }
      />
    </Tooltip>
  );
};

export default FullscreenAvatar;
