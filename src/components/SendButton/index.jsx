import { SendOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styles from './index.less';

/**
 * 通用发送按钮（圆形，禁用时灰色，启用时黑色）
 * 适用于问答、图像、视频等输入框的发送场景
 */
const SendButton = ({ onClick, disabled, loading, className = '', style }) => {
  return (
    <Button
      className={`${styles['send-button']} ${className}`.trim()}
      type="primary"
      icon={<SendOutlined />}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      style={style}
    />
  );
};

export default SendButton;
