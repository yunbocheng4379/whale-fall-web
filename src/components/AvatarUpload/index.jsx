import LoginApi from '@/api/LoginApi';
import {
  DeleteOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, message, Popconfirm, Upload } from 'antd';
import { useState } from 'react';

const AvatarUpload = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [hovered, setHovered] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setImageUrl('');
    onUploadSuccess?.(null);
    message.success('头像已移除');
  };

  const handleUpload = async ({ file }) => {
    if (!file) {
      message.warning('请选择有效文件');
      return;
    }
    if (file.size > 1024 * 1024) {
      message.warning(`文件大小不能超过1MB`);
      return;
    }
    if (!['image/jpg', 'image/png'].includes(file.type)) {
      message.error('仅支持JPG/PNG格式');
      return false;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { success, data } = await LoginApi.uploadAvatar(formData);
      if (success) {
        message.success('头像上传成功');
        setImageUrl(data.url);
        onUploadSuccess?.(data.url);
      } else {
        onUploadSuccess?.(null);
      }
    } catch (error) {
      message.warning('头像上传失败，' + error);
      onUploadSuccess?.(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Avatar
          style={{
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: 50,
            height: 50,
            transition: 'opacity 0.3s',
            opacity: hovered ? 0.8 : 1,
          }}
          src={imageUrl}
          size={64}
          icon={!imageUrl && <UserOutlined />}
        />

        {imageUrl && hovered && (
          <Popconfirm
            title="确定要删除头像吗？"
            onConfirm={handleDelete}
            okText="确定"
            cancelText="取消"
            placement="top"
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DeleteOutlined
                style={{
                  fontSize: 18,
                  color: '#fff',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              />
            </div>
          </Popconfirm>
        )}
      </div>

      <Upload
        showUploadList={false}
        beforeUpload={(file) => handleUpload({ file })}
      >
        <Button icon={<UploadOutlined />} loading={loading}>
          上传头像
        </Button>
        <div style={{ fontSize: 12, color: '#666' }}>
          支持JPG/PNG格式，文件大小不超过1MB
        </div>
      </Upload>
    </div>
  );
};

export default AvatarUpload;
