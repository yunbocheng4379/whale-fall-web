import { withAuth } from '@/components/Auth';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import moment from 'moment';
import { useRef, useState } from 'react';
import './index.less';

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '测试人员', value: 'tester' },
  { label: '普通用户', value: 'user' },
];

const Day = () => {
  const actionRef = useRef();
  const [modalVisible, setModalVisible] = useState(false);

  // 模拟请求接口
  const requestUsers = async (params, sort, filter) => {
    console.log('请求参数:', params, sort, filter);
    // 这里实际应调用后端接口
    return {
      data: [
        {
          id: 1,
          name: '张三',
          role: 'admin',
          createTime: '2025-08-01 10:00:00',
        },
        {
          id: 2,
          name: '李四',
          role: 'tester',
          createTime: '2025-08-15 15:20:00',
        },
      ],
      success: true,
      total: 2,
    };
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      width: 80,
      align: 'center',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      align: 'center',
    },
    {
      title: '角色',
      dataIndex: 'role',
      align: 'center',
      filters: true,
      onFilter: true,
      valueEnum: {
        admin: { text: '管理员', status: 'Error' },
        tester: { text: '测试人员', status: 'Processing' },
        user: { text: '普通用户', status: 'Default' },
      },
      render: (_, record) => {
        const role = roleOptions.find((r) => r.value === record.role);
        return (
          <Tag
            color={
              record.role === 'admin'
                ? 'red'
                : record.role === 'tester'
                  ? 'blue'
                  : 'green'
            }
          >
            {role?.label}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      sorter: true,
      align: 'center',
      valueType: 'dateTimeRange',
      search: {
        transform: (value) => {
          return {
            startTime: value[0],
            endTime: value[1],
          };
        },
      },
      render: (_, record) =>
        record.createTime
          ? moment(record.createTime).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      align: 'center',
      render: (_, record) => [
        <a key="edit">分配权限</a>,
        <Popconfirm
          key="delete"
          title="确定删除该用户吗？"
          onConfirm={() => message.success(`已删除用户 ${record.name}`)}
        >
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable
        headerTitle="用户角色列表"
        rowKey="id"
        actionRef={actionRef}
        request={requestUsers}
        columns={columns}
        pagination={{
          pageSize: 10,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            onClick={() => setModalVisible(true)}
          >
            添加用户
          </Button>,
        ]}
      />

      <ModalForm
        title="新增用户"
        open={modalVisible}
        modalProps={{
          destroyOnClose: true,
        }}
        onFinish={async (values) => {
          console.log('新增用户:', values);
          message.success('新增用户成功');
          setModalVisible(false);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="用户姓名"
          placeholder="请输入用户姓名"
          rules={[{ required: true, message: '请输入用户姓名' }]}
        />
        <ProFormSelect
          name="role"
          label="角色"
          options={roleOptions}
          placeholder="请选择角色"
          rules={[{ required: true, message: '请选择角色' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default withAuth(Day);
