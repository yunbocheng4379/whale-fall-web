import { MyIcon } from '@/utils/iconUtil';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Menu, Modal, Tooltip } from 'antd';
import { useMemo, useState } from 'react';
import { history } from 'umi';
import './index.less';

const SearchMenu = ({ menuData }) => {
  const [keyword, setKeyword] = useState('');
  const [visible, setVisible] = useState(false);

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
      <Tooltip title={'菜单搜索'} placement="bottom">
        <div className="trigger" onClick={() => setVisible(true)}>
          <SearchOutlined style={{ fontSize: 20 }} />
        </div>
      </Tooltip>

      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        closable={false}
        width={600}
        centered={false}
        style={{
          top: '20%',
          paddingBottom: 0,
        }}
      >
        <div className="searchBox">
          <Input
            placeholder="搜索菜单: 支持名称/路径"
            prefix={<MyIcon type="icon-search" style={{ fontSize: 18 }} />}
            allowClear
            autoFocus
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              height: 40,
            }}
          />
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
              history.push(key);
              setVisible(false);
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default SearchMenu;
