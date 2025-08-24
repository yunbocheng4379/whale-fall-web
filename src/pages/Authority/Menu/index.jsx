import React, { useMemo, useRef, useState } from 'react';
import { withAuth } from '@/components/Auth';
import {
  PageContainer,
  ProCard,
  ProTable,
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormRadio,
} from '@ant-design/pro-components';
import { Button, Space, Tag, Popconfirm, message, Typography, Divider } from 'antd';
import {
  PlusOutlined,
  NodeIndexOutlined,
  FolderAddOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import './index.less';

const { Title, Text } = Typography;

// 角色选项
const ROLE_OPTIONS = [
  { label: '管理员', value: 'admin' },
  { label: '普通人员', value: 'user' },
  { label: '测试人员', value: 'tester' },
];

// 状态映射
const FLAG_ENUM = {
  1: { text: '正常', status: 'Success', color: 'green' },
  0: { text: '删除', status: 'Default', color: 'default' },
};

// 初始 mock 数据（可换成后端）
const initMenus = [
  {
    id: 1,
    menu_name: '系统管理',
    path: '/system',
    menu_icon: 'SettingOutlined',
    menu_rank: 1,
    menu_flag: 1,
    roles: ['admin'],
    create_time: '2025-08-01 10:00:00',
    update_time: '2025-08-10 08:00:00',
  },
  {
    id: 2,
    menu_name: '工作台',
    path: '/dashboard',
    menu_icon: 'DashboardOutlined',
    menu_rank: 2,
    menu_flag: 1,
    roles: ['admin', 'user', 'tester'],
    create_time: '2025-07-21 15:30:00',
    update_time: '2025-08-09 09:10:00',
  },
];

const initNodes = [
  {
    id: 11,
    menu_id: 1,
    node_name: '用户管理',
    node_icon: 'TeamOutlined',
    node_rank: 1,
    node_route: '/system/user',
    node_flag: 1,
    roles: ['admin'],
    create_time: '2025-08-01 11:00:00',
    update_time: '2025-08-03 11:00:00',
  },
  {
    id: 12,
    menu_id: 1,
    node_name: '角色管理',
    node_icon: 'IdcardOutlined',
    node_rank: 2,
    node_route: '/system/role',
    node_flag: 1,
    roles: ['admin', 'tester'],
    create_time: '2025-08-02 12:00:00',
    update_time: '2025-08-06 13:00:00',
  },
  {
    id: 21,
    menu_id: 2,
    node_name: '分析页',
    node_icon: 'AreaChartOutlined',
    node_rank: 1,
    node_route: '/dashboard/analysis',
    node_flag: 1,
    roles: ['admin', 'user', 'tester'],
    create_time: '2025-07-22 09:00:00',
    update_time: '2025-08-08 09:00:00',
  },
];

const Menu = () => {
  const actionRef = useRef();
  const [menus, setMenus] = useState(initMenus);
  const [nodes, setNodes] = useState(initNodes);

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [currentMenuIdForNode, setCurrentMenuIdForNode] = useState(null);

  const menuDataSource = useMemo(() => menus, [menus]);

  // —— 菜单表请求（模拟后端，可替换为 request('/api/menu', { params })）
  const requestMenus = async (params, sort, filter) => {
    // params: { current, pageSize, menu_name, roles, ... }
    // sort / filter 可自行透传后端
    let data = [...menuDataSource];

    // 过滤（示例）
    if (params.menu_name) {
      data = data.filter((m) =>
        String(m.menu_name).toLowerCase().includes(String(params.menu_name).toLowerCase()),
      );
    }
    if (params.roles?.length) {
      data = data.filter((m) => m.roles.some((r) => params.roles.includes(r)));
    }

    // 排序（示例：支持 menu_rank / create_time）
    if (sort && Object.keys(sort).length) {
      const [field, order] = Object.entries(sort)[0];
      data.sort((a, b) => {
        const va = a[field];
        const vb = b[field];
        if (field.includes('time')) {
          return order === 'ascend'
            ? moment(va).valueOf() - moment(vb).valueOf()
            : moment(vb).valueOf() - moment(va).valueOf();
        }
        return order === 'ascend' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      });
    }

    // 分页（示例）
    const total = data.length;
    const current = params.current || 1;
    const pageSize = params.pageSize || 10;
    const pageData = data.slice((current - 1) * pageSize, current * pageSize);

    return {
      data: pageData,
      success: true,
      total,
    };
  };

  // —— 子节点请求（展开行内的小表使用；同样可换后端）
  const requestNodesByMenu = async (menuId, params, sort) => {
    let data = nodes.filter((n) => n.menu_id === menuId);

    if (params?.node_name) {
      data = data.filter((n) =>
        String(n.node_name).toLowerCase().includes(String(params.node_name).toLowerCase()),
      );
    }
    if (params?.roles?.length) {
      data = data.filter((n) => n.roles.some((r) => params.roles.includes(r)));
    }
    if (sort && Object.keys(sort).length) {
      const [field, order] = Object.entries(sort)[0];
      data.sort((a, b) => {
        const va = a[field];
        const vb = b[field];
        if (field.includes('time')) {
          return order === 'ascend'
            ? moment(va).valueOf() - moment(vb).valueOf()
            : moment(vb).valueOf() - moment(va).valueOf();
        }
        return order === 'ascend' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      });
    }

    // 子表一般不分页，这里仍提供分页示例
    const total = data.length;
    const current = params.current || 1;
    const pageSize = params.pageSize || 5;
    const pageData = data.slice((current - 1) * pageSize, current * pageSize);

    return { data: pageData, success: true, total };
  };

  // —— 新增/编辑 菜单
  const upsertMenu = async (values) => {
    if (editingMenu) {
      setMenus((prev) =>
        prev.map((m) =>
          m.id === editingMenu.id
            ? {
              ...m,
              ...values,
              update_time: moment().format('YYYY-MM-DD HH:mm:ss'),
            }
            : m,
        ),
      );
      message.success('菜单已更新');
    } else {
      const newId = Math.max(0, ...menus.map((m) => m.id)) + 1;
      setMenus((prev) => [
        ...prev,
        {
          id: newId,
          ...values,
          menu_flag: Number(values.menu_flag ?? 1),
          create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
          update_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      ]);
      message.success('菜单已新增');
    }
    setMenuModalOpen(false);
    setEditingMenu(null);
    actionRef.current?.reload();
    return true;
  };

  const removeMenu = async (record) => {
    // 先删除其子节点
    setNodes((prev) => prev.filter((n) => n.menu_id !== record.id));
    // 再删除菜单
    setMenus((prev) => prev.filter((m) => m.id !== record.id));
    message.success('已删除菜单及其子节点');
    actionRef.current?.reload();
  };

  // —— 新增/编辑 子节点
  const upsertNode = async (values) => {
    const menuId = editingNode?.menu_id ?? currentMenuIdForNode;
    if (!menuId) {
      message.error('缺少父菜单 ID');
      return false;
    }
    if (editingNode) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === editingNode.id
            ? { ...n, ...values, menu_id: menuId, update_time: moment().format('YYYY-MM-DD HH:mm:ss') }
            : n,
        ),
      );
      message.success('节点已更新');
    } else {
      const newId = Math.max(0, ...nodes.map((n) => n.id)) + 1;
      setNodes((prev) => [
        ...prev,
        {
          id: newId,
          menu_id: menuId,
          ...values,
          node_flag: Number(values.node_flag ?? 1),
          create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
          update_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      ]);
      message.success('节点已新增');
    }
    setNodeModalOpen(false);
    setEditingNode(null);
    setCurrentMenuIdForNode(null);
    actionRef.current?.reload(); // 触发父表刷新，从而刷新展开表
    return true;
  };

  const removeNode = async (record) => {
    setNodes((prev) => prev.filter((n) => n.id !== record.id));
    message.success('已删除节点');
    actionRef.current?.reload();
  };

  // —— 父表（菜单）列定义
  const menuColumns = [
    {
      title: '菜单名',
      dataIndex: 'menu_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '根路径',
      dataIndex: 'path',
      width: 180,
      ellipsis: true,
    },
    {
      title: '图标',
      dataIndex: 'menu_icon',
      width: 160,
      render: (_, r) => <span>{r.menu_icon || '-'}</span>,
    },
    {
      title: '排名',
      dataIndex: 'menu_rank',
      sorter: true,
      width: 100,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'menu_flag',
      width: 100,
      align: 'center',
      render: (_, r) => <Tag color={FLAG_ENUM[r.menu_flag]?.color}>{FLAG_ENUM[r.menu_flag]?.text}</Tag>,
    },
    {
      title: '权限角色',
      dataIndex: 'roles',
      width: 260,
      render: (_, r) => (
        <Space wrap>
          {(r.roles || []).map((role) => (
            <Tag
              key={role}
              color={role === 'admin' ? 'red' : role === 'tester' ? 'blue' : 'green'}
            >
              {ROLE_OPTIONS.find((o) => o.value === role)?.label || role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
      sorter: true,
      width: 200,
      render: (_, r) => (r.create_time ? moment(r.create_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 260,
      align: 'center',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingMenu(record);
            setMenuModalOpen(true);
          }}
        >
          编辑
        </Button>,
        <Button
          key="addChild"
          type="link"
          icon={<NodeIndexOutlined />}
          onClick={() => {
            setCurrentMenuIdForNode(record.id);
            setEditingNode(null);
            setNodeModalOpen(true);
          }}
        >
          新增子节点
        </Button>,
        <Popconfirm
          key="del"
          title="确认删除该菜单及其所有子节点？"
          onConfirm={() => removeMenu(record)}
        >
          <Button danger type="link" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  // —— 子表（节点）列定义
  const nodeColumns = (menuId) => [
    {
      title: '节点名称',
      dataIndex: 'node_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '前端路由',
      dataIndex: 'node_route',
      width: 220,
      ellipsis: true,
    },
    {
      title: '图标',
      dataIndex: 'node_icon',
      width: 160,
      render: (_, r) => <span>{r.node_icon || '-'}</span>,
    },
    {
      title: '排名',
      dataIndex: 'node_rank',
      width: 100,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'node_flag',
      width: 100,
      align: 'center',
      render: (_, r) => <Tag color={FLAG_ENUM[r.node_flag]?.color}>{FLAG_ENUM[r.node_flag]?.text}</Tag>,
    },
    {
      title: '权限角色',
      dataIndex: 'roles',
      width: 260,
      render: (_, r) => (
        <Space wrap>
          {(r.roles || []).map((role) => (
            <Tag
              key={role}
              color={role === 'admin' ? 'red' : role === 'tester' ? 'blue' : 'green'}
            >
              {ROLE_OPTIONS.find((o) => o.value === role)?.label || role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
      width: 200,
      render: (_, r) => (r.create_time ? moment(r.create_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      align: 'center',
      render: (_, record) => [
        <Button
          key="editNode"
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingNode(record);
            setNodeModalOpen(true);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delNode"
          title="确认删除该子节点？"
          onConfirm={() => removeNode(record)}
        >
          <Button danger type="link" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  // —— 父表：展开渲染子表
  const expandedRowRender = (parent) => {
    return (
      <div className="child-table-wrap">
        <div className="child-table-header">
          <FolderAddOutlined />
          <Text className="ml8">子节点（{parent.menu_name}）</Text>
          <div className="flex-1" />
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentMenuIdForNode(parent.id);
              setEditingNode(null);
              setNodeModalOpen(true);
            }}
          >
            新增子节点
          </Button>
        </div>
        <ProTable
          rowKey="id"
          options={false}
          search={{
            filterType: 'light',
            labelWidth: 'auto',
          }}
          pagination={{
            pageSize: 5,
            size: 'small',
          }}
          request={(params, sort) => requestNodesByMenu(parent.id, params, sort)}
          columns={nodeColumns(parent.id)}
          toolBarRender={false}
          className="child-pro-table"
        />
      </div>
    );
  };

  return (
    <PageContainer title={false}>
      <ProTable
        rowKey="id"
        actionRef={actionRef}
        columns={menuColumns}
        request={requestMenus}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        search={{
          filterType: 'light',
          labelWidth: 'auto',
        }}
        expandable={{
          expandedRowRender,
        }}
        toolBarRender={() => [
          <Button
            key="addMenu"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingMenu(null);
              setMenuModalOpen(true);
            }}
          >
            新增父菜单
          </Button>,
        ]}
      />

      {/* 新增/编辑 父菜单 */}
      <ModalForm
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        open={menuModalOpen}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setMenuModalOpen(false);
            setEditingMenu(null);
          },
        }}
        initialValues={
          editingMenu || {
            menu_flag: 1,
            menu_rank: 1,
            roles: ['admin'],
          }
        }
        onFinish={upsertMenu}
      >
        <ProFormText
          name="menu_name"
          label="菜单名"
          placeholder="例如：系统管理"
          rules={[{ required: true, message: '请输入菜单名' }]}
        />
        <ProFormText
          name="path"
          label="根路径"
          placeholder="/system"
          rules={[{ required: true, message: '请输入根路径' }]}
        />
        <ProFormText
          name="menu_icon"
          label="菜单图标"
          placeholder="SettingOutlined"
        />
        <ProFormDigit
          name="menu_rank"
          label="菜单排名"
          min={0}
          fieldProps={{ precision: 0, style: { width: '100%' } }}
        />
        <ProFormRadio.Group
          name="menu_flag"
          label="菜单状态"
          options={[
            { label: '正常', value: 1 },
            { label: '删除', value: 0 },
          ]}
        />
        <ProFormSelect
          name="roles"
          label="权限角色"
          mode="multiple"
          options={ROLE_OPTIONS}
          rules={[{ required: true, message: '请选择角色' }]}
          placeholder="可多选"
        />
      </ModalForm>

      {/* 新增/编辑 子节点 */}
      <ModalForm
        title={editingNode ? '编辑子节点' : '新增子节点'}
        open={nodeModalOpen}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setNodeModalOpen(false);
            setEditingNode(null);
            setCurrentMenuIdForNode(null);
          },
        }}
        initialValues={
          editingNode || {
            node_flag: 1,
            node_rank: 1,
            roles: ['admin'],
          }
        }
        onFinish={upsertNode}
      >
        <ProFormText
          name="node_name"
          label="节点名称"
          placeholder="例如：用户管理"
          rules={[{ required: true, message: '请输入节点名称' }]}
        />
        <ProFormText
          name="node_route"
          label="节点前端路由"
          placeholder="/system/user"
          rules={[{ required: true, message: '请输入前端路由' }]}
        />
        <ProFormText
          name="node_icon"
          label="节点图标"
          placeholder="TeamOutlined"
        />
        <ProFormDigit
          name="node_rank"
          label="节点排名"
          min={0}
          fieldProps={{ precision: 0, style: { width: '100%' } }}
        />
        <ProFormRadio.Group
          name="node_flag"
          label="节点状态"
          options={[
            { label: '正常', value: 1 },
            { label: '删除', value: 0 },
          ]}
        />
        <ProFormSelect
          name="roles"
          label="权限角色"
          mode="multiple"
          options={ROLE_OPTIONS}
          rules={[{ required: true, message: '请选择角色' }]}
          placeholder="可多选"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default withAuth(Menu);
