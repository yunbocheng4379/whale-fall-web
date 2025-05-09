import LoginApi from '@/api/LoginApi';
import { SETTING_PATH } from '@/config';
import { getAvatarUrl } from '@/utils/storage';
import {
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
  UserOutlined,
  ZoomInOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  message,
  Modal,
  Popconfirm,
  Tooltip,
  Upload,
} from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'umi';

const AvatarUpload = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [hovered, setHovered] = useState(false);
  const [loadFlag, setLoadFlag] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let loadFlag = location.pathname === SETTING_PATH;
    setLoadFlag(loadFlag);
    if (loadFlag) {
      setImageUrl(getAvatarUrl);
    }
  }, []);

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
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      message.error('仅支持JPG/PNG格式');
      return false;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { success, data } = await LoginApi.uploadAvatar(formData);
      if (success) {
        if (!loadFlag) message.success('头像上传成功');
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

  return loadFlag ? (
    <div
      style={{
        position: 'relative',
        width: 120,
        height: 120,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
          transition: 'opacity 0.3s',
          opacity: hovered ? 0.8 : 1,
        }}
        src={imageUrl}
        icon={!imageUrl && <UserOutlined style={{ fontSize: 24 }} />}
      />

      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 4,
          }}
        >
          <Upload
            showUploadList={false}
            beforeUpload={(file) => handleUpload({ file })}
          >
            <div
              style={{
                width: '30%',
                height: '30%',
                minWidth: 24,
                minHeight: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Tooltip title={imageUrl ? '编辑' : '上传'}>
                {imageUrl ? <EditOutlined /> : <UploadOutlined />}
              </Tooltip>
            </div>
          </Upload>

          {imageUrl && (
            <div
              style={{
                width: '30%',
                height: '30%',
                minWidth: 24,
                minHeight: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
              onClick={() => {
                if (imageUrl) {
                  Modal.info({
                    content: (
                      <img
                        src={imageUrl}
                        alt="头像预览"
                        style={{ width: '100%', borderRadius: 4 }}
                      />
                    ),
                    icon: null,
                    width: 480,
                    maskClosable: true,
                  });
                }
              }}
            >
              <Tooltip title="查看">
                <ZoomInOutlined />
              </Tooltip>
            </div>
          )}

          {imageUrl && (
            <Popconfirm
              title="确定要删除头像吗？"
              onConfirm={handleDelete}
              okText="确定"
              cancelText="取消"
              placement="top"
            >
              <div
                style={{
                  width: '30%',
                  height: '30%',
                  minWidth: 24,
                  minHeight: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <Tooltip title="删除">
                  <DeleteOutlined />
                </Tooltip>
              </div>
            </Popconfirm>
          )}
        </div>
      )}
    </div>
  ) : (
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
