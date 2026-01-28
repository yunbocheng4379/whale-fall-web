import { MyIcon } from '@/utils/iconUtil';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Menu, Modal, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useState, useRef} from 'react';
import { history } from 'umi';
import './index.less';

const { Text } = Typography;

const SearchMenu = ({ menuData }) => {
  const [keyword, setKeyword] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // 打开搜索弹窗
  const openSearchModal = () => {
    setVisible(true);
  };

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 检测 Ctrl+K 或 Cmd+K (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        openSearchModal();
      }
      // ESC 键关闭弹窗
      if (event.key === 'Escape' && visible) {
        setVisible(false);
        setKeyword('');
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // Modal 打开时自动聚焦到输入框
  useEffect(() => {
    if (visible) {
      // 使用多重延迟确保在所有情况下都能聚焦
      const focusInput = () => {
        if (inputRef.current) {
          try {
            // 尝试聚焦到 Ant Design Input 组件
            if (inputRef.current.focus) {
              inputRef.current.focus();
            }

            // 获取实际的 DOM input 元素
            const inputElement = inputRef.current.input || inputRef.current;
            if (inputElement && inputElement.focus) {
              inputElement.focus();

              // 确保光标在输入框末尾
              if (inputElement.setSelectionRange) {
                const length = inputElement.value ? inputElement.value.length : 0;
                inputElement.setSelectionRange(length, length);
              }
            }
          } catch (error) {
            console.warn('聚焦输入框失败:', error);
          }
        }
      };

      // 立即尝试聚焦
      focusInput();

      // 延迟聚焦确保 Modal 完全渲染
      const timer1 = setTimeout(focusInput, 100);
      const timer2 = setTimeout(focusInput, 200);
      const timer3 = setTimeout(focusInput, 500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [visible]);

  // 键盘导航处理
  const handleKeyDown = (event) => {
    if (!visible || searchResult.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResult.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : searchResult.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (searchResult[selectedIndex]) {
          handleMenuSelect(searchResult[selectedIndex].path);
        }
        break;
    }
  };

  // 处理菜单选择
  const handleMenuSelect = (path) => {
    history.push(path);
    handleClose();
  };

  // 关闭弹窗时清空搜索关键词
  const handleClose = () => {
    setVisible(false);
    setKeyword('');
    setSelectedIndex(0);
  };

  const searchResult = useMemo(() => {
    const result = [];

    const search = (items) => {
      items.forEach((item) => {
        if (
          item.name?.toLowerCase().includes(keyword.toLowerCase()) ||
          item.path?.toLowerCase().includes(keyword.toLowerCase())
        ) {
          result.push(item);
        }
        if (item.children) {
          search(item.children);
        }
      });
    };

    if (keyword && menuData) {
      search(menuData);
    }
    return result.slice(0, 8);
  }, [keyword, menuData]);

  return (
    <>
      <Tooltip
        title={
          <div>
            <div>菜单搜索</div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              快捷键: Ctrl + K
            </div>
          </div>
        }
        placement="bottom"
      >
        <div
          className="search-trigger-button"
          onClick={openSearchModal}
        >
          <SearchOutlined className="search-icon" />
          <Text className="search-text">搜索</Text>
          <div className="shortcut-key">
            <Text className="key-text">Ctrl+K</Text>
          </div>
        </div>
      </Tooltip>

      <Modal
        open={visible}
        onCancel={handleClose}
        footer={null}
        closable={false}
        width={600}
        centered={false}
        style={{
          top: '20%',
          paddingBottom: 0,
        }}
        className="search-modal"
        afterOpenChange={(open) => {
          // Modal 打开动画完成后再次尝试聚焦
          if (open && inputRef.current) {
            setTimeout(() => {
              if (inputRef.current) {
                const inputElement = inputRef.current.input || inputRef.current;
                if (inputElement && inputElement.focus) {
                  inputElement.focus();
                }
              }
            }, 100);
          }
        }}
      >
        <div className="searchBox">
          <Input
            ref={inputRef}
            className="search-input"
            placeholder="搜索菜单: 支持名称/路径"
            prefix={<MyIcon type="icon-search" style={{ fontSize: 18 }} />}
            allowClear
            autoFocus
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setSelectedIndex(0); // 重置选中索引
            }}
            onKeyDown={handleKeyDown}
            style={{
              height: 40,
            }}
          />
          {keyword && searchResult.length === 0 ? (
            <div className="empty-state">
              <SearchOutlined className="empty-icon" />
              <Text className="empty-text">未找到相关菜单</Text>
              <Text className="empty-hint">尝试使用其他关键词搜索</Text>
            </div>
          ) : (
            <Menu
              mode="inline"
              className="customMenu"
              selectedKeys={[]}
              items={searchResult.map((item) => ({
                key: item.path,
                label: (
                  <div className="menuItemContainer">
                    <div className="contentWrapper">
                      {item.icon && <MyIcon type={item.icon} />}
                      <span className="itemName">{item.name}</span>
                      <span className="itemPath">{item.path}</span>
                    </div>
                    <Button
                      className="itemButton"
                      type="text"
                      icon={<SearchOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </div>
                ),
              }))}
              onSelect={({ key }) => {
                handleMenuSelect(key);
              }}
            />
          )}
        </div>
      </Modal>
    </>
  );
};

export default SearchMenu;
