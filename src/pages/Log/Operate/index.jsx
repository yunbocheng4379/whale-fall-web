import {withAuth} from '@/components/Auth';
import {PageContainer, ProTable} from '@ant-design/pro-components';
import {Button, Tag, message} from 'antd';
import {useRef} from 'react';
import moment from 'moment';
import styles from './index.less';
import OperateApi from '@/api/OperateApi';

// 操作类型枚举（与后端 operation_type 对应）
const operationTypeOptions = [
  { label: '创建', value: 'CREATE' },
  { label: '更新', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
  { label: '批量操作', value: 'BATCH_OPERATE' },
];

const successOptions = [
  { label: '成功', value: true },
  { label: '失败', value: false },
];

const Operate = () => {
  const tableRef = useRef();

  const operationTypeEnum = operationTypeOptions.reduce(
    (acc, cur) => ({ ...acc, [cur.value]: { text: cur.label } }),
    {},
  );
  const successEnum = {
    true: { text: '成功', status: 'Success' },
    false: { text: '失败', status: 'Error' },
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'operateTime',
      width: 220,
      align: 'center',
      sorter: true,
      valueType: 'dateTimeRange',
      search: {
        transform: (value) => ({
          startTime: value?.[0] ? moment(value[0]).format('YYYY-MM-DD HH:mm:ss') : undefined,
          endTime: value?.[1] ? moment(value[1]).format('YYYY-MM-DD HH:mm:ss') : undefined,
        }),
      },
      render: (_, record) =>
        record.operateTime ? moment(record.operateTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 150,
      align: 'center',
    },
    {
      title: '资源',
      dataIndex: 'resource',
      width: 250,
      align: 'center',
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      width: 140,
      valueEnum: operationTypeEnum,
      align: 'center',
      valueType: 'select',
      fieldProps: {
        options: operationTypeOptions,
        allowClear: true,
      },
      render: (_, record) => operationTypeEnum[record.operationType]?.text || record.operationType || '-',
    },
    {
      title: '状态',
      dataIndex: 'success',
      width: 100,
      valueEnum: successEnum,
      align: 'center',
      valueType: 'select',
      fieldProps: {
        options: successOptions,
        allowClear: true,
      },
      render: (_, record) => (
        <Tag color={record.success ? 'green' : 'red'}>
          {record.success ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '请求方法',
      dataIndex: 'requestMethod',
      width: 120,
      align: 'center',
      valueType: 'text',
    },
    {
      title: '请求URI',
      dataIndex: 'requestUri',
      width: 260,
      ellipsis: true,
      align: 'center',
      valueType: 'text',
    },
    {
      title: '客户端IP',
      dataIndex: 'clientIp',
      width: 150,
      align: 'center',
      valueType: 'text',
    },
    {
      title: '请求参数',
      dataIndex: 'requestParams',
      ellipsis: true,
      align: 'center',
      valueType: 'text',
    },
    {
      title: '返回结果',
      dataIndex: 'resultParams',
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
    {
      title: '批次ID',
      dataIndex: 'batchId',
      width: 180,
      align: 'center',
      valueType: 'text',
    },
    {
      title: '错误信息',
      dataIndex: 'errorMsg',
      ellipsis: true,
      align: 'center',
      search: false,
    },
  ];

  // 将驼峰命名转换为下划线命名（用于排序字段）
  const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  };

  // 调用后端查询操作日志
  const fetchLogs = async (params, sort) => {
    try {
      const requestPayload = {
        operator: params.operator?.trim(),
        resource: params.resource?.trim(),
        operationType: params.operationType,
        success: params.success,
        requestMethod: params.requestMethod?.trim(),
        requestUri: params.requestUri?.trim(),
        clientIp: params.clientIp?.trim(),
        requestParams: params.requestParams?.trim(),
        batchId: params.batchId?.trim(),
        startTime: params.startTime,
        endTime: params.endTime,
        current: params.current || 1,
        pageSize: params.pageSize || 10,
      };

      if (sort && Object.keys(sort).length > 0) {
        const key = Object.keys(sort)[0];
        // 将驼峰命名转换为下划线命名（如 operateTime -> operate_time）
        requestPayload.sortField = camelToSnake(key);
        requestPayload.sortOrder = sort[key] === 'ascend' ? 'asc' : 'desc';
      }

      const res = await OperateApi.getOperateLogs(requestPayload);
      if (res?.success && res?.data?.data) {
        const pageData = res.data.data; // IPage<OperateLogVO>
        const records =
          pageData.records || pageData.rows || pageData.list || pageData.data || [];
        return {
          data: records,
          success: true,
          total: pageData.total || records.length,
        };
      }
      return { data: [], success: false, total: 0 };
    } catch (error) {
      console.error('获取操作日志失败:', error);
      message.error('获取操作日志失败，请稍后重试');
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
        scroll={{ x: 2500 }}
      />
    </PageContainer>
  );
};

export default withAuth(Operate);
