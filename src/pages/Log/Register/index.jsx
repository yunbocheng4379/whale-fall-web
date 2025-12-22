import LogCenterApi from '@/api/LogCenterApi';
import { withAuth } from '@/components/Auth';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import moment from 'moment';
import { useRef } from 'react';
import styles from './index.less';

// 登录方式枚举（与后端 LoginType 保持一致）
const loginTypeOptions = [
  { label: '未知', value: 'UNKNOWN' },
  { label: '账号密码', value: 'ACCOUNT_PASSWORD' },
  { label: '手机号', value: 'PHONE' },
  { label: '邮箱', value: 'EMAIL' },
  { label: 'GitHub', value: 'GITHUB' },
  { label: 'Gitee', value: 'GITEE' },
  { label: 'GitLab', value: 'GITLIB' },
  { label: '飞书', value: 'FEISHU' },
];

const statusOptions = [
  { label: '成功', value: true },
  { label: '失败', value: false },
];

const Register = () => {
  const tableRef = useRef();

  const loginTypeEnum = loginTypeOptions.reduce(
    (acc, cur) => ({ ...acc, [cur.value]: { text: cur.label } }),
    {},
  );
  const statusEnum = {
    true: { text: '成功', status: 'Success' },
    false: { text: '失败', status: 'Error' },
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'operationTime',
      width: 220,
      align: 'center',
      sorter: true,
      valueType: 'dateTimeRange',
      search: {
        transform: (value) => ({
          startTime: value?.[0]
            ? moment(value[0]).format('YYYY-MM-DD HH:mm:ss')
            : undefined,
          endTime: value?.[1]
            ? moment(value[1]).format('YYYY-MM-DD HH:mm:ss')
            : undefined,
        }),
      },
      render: (_, record) =>
        record.operationTime
          ? moment(record.operationTime).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 150,
      align: 'center',
    },
    {
      title: '登录方式',
      dataIndex: 'loginType',
      width: 150,
      valueEnum: loginTypeEnum,
      align: 'center',
      valueType: 'select',
      fieldProps: {
        options: loginTypeOptions,
        allowClear: true,
      },
      render: (_, record) =>
        record.loginTypeDesc || loginTypeEnum[record.loginType]?.text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: statusEnum,
      align: 'center',
      valueType: 'select',
      fieldProps: {
        options: statusOptions,
        allowClear: true,
      },
      render: (_, record) => (
        <Tag color={record.status ? 'green' : 'red'}>
          {record.status ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '请求参数',
      dataIndex: 'requestParams',
      ellipsis: true,
      align: 'center',
      valueType: 'text',
    },
    {
      title: '响应结果',
      dataIndex: 'responseResult',
      ellipsis: true,
      align: 'center',
      search: false,
    },
    {
      title: '错误信息',
      dataIndex: 'errorMsg',
      ellipsis: true,
      align: 'center',
      search: false,
    },
    {
      title: '耗时(毫秒)',
      dataIndex: 'executionTime',
      width: 120,
      align: 'center',
      sorter: true,
      search: false,
    },
  ];

  // 将驼峰命名转换为下划线命名（用于排序字段）
  const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  };

  // 调用后端查询登录日志
  const fetchLogs = async (params, sort) => {
    try {
      const requestPayload = {
        operator: params.operator?.trim(),
        loginType: params.loginType,
        status: params.status,
        requestParams: params.requestParams?.trim(),
        startTime: params.startTime,
        endTime: params.endTime,
        // 使用后端新的分页字段：current / pageSize
        current: params.current || 1,
        pageSize: params.pageSize || 10,
      };

      if (sort && Object.keys(sort).length > 0) {
        const key = Object.keys(sort)[0];
        // 将驼峰命名转换为下划线命名（如 operationTime -> operation_time）
        requestPayload.sortField = camelToSnake(key);
        requestPayload.sortOrder = sort[key] === 'ascend' ? 'asc' : 'desc';
      }

      const res = await LogCenterApi.getLoginLogs(requestPayload);
      if (res?.success && res?.data?.data) {
        const pageData = res.data.data; // IPage<LoginLogVO>
        const records =
          pageData.records ||
          pageData.rows ||
          pageData.list ||
          pageData.data ||
          [];
        return {
          data: records,
          success: true,
          total: pageData.total || records.length,
        };
      }
      return { data: [], success: false, total: 0 };
    } catch (error) {
      console.error('获取登录日志失败:', error);
      message.error('获取登录日志失败，请稍后重试');
      return { data: [], success: false, total: 0 };
    }
  };

  return (
    <PageContainer
      className={styles.pageContainer}
      header={{
        title: false,
      }}
    >
      <ProTable
        actionRef={tableRef}
        rowKey="id"
        columns={columns}
        search={{
          labelWidth: 'auto',
          filterType: 'light',
          optionRender: (searchConfig, formProps, doms) => [
            ...doms,
            <Button
              key="reset"
              onClick={() => {
                formProps?.form?.resetFields();
                tableRef.current?.reload();
              }}
            >
              重置
            </Button>,
          ],
        }}
        dateFormatter="string"
        request={fetchLogs}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
        scroll={{ x: 1200 }}
      />
    </PageContainer>
  );
};

export default withAuth(Register);
