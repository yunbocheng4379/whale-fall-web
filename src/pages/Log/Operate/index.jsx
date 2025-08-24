import {withAuth} from '@/components/Auth';
import {PageContainer, ProTable} from '@ant-design/pro-components';
import {Button} from 'antd';
import {useRef, useState} from 'react';
import moment from 'moment';
import styles from './index.less';

// 日志类型示例
const logTypeOptions = [
  { label: '登录成功', value: 'success' },
  { label: '登录失败', value: 'fail' },
];

const Operate = () => {
  const tableRef = useRef();
  const [filters, setFilters] = useState({
    dateRange: [],
    logType: undefined,
  });

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      width: 250,
      align: 'center',
      sorter: true,
      valueType: 'dateTimeRange',
      search: {
        transform: (value) => {
          // 将前端选择的数组 [start, end] 转为接口参数
          return {
            startTime: value ? moment(value[0]).format('YYYY-MM-DD HH:mm:ss') : undefined,
            endTime: value ? moment(value[1]).format('YYYY-MM-DD HH:mm:ss') : undefined,
          };
        },
      },
      render: (_, record) =>
        moment(record.timestamp).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 150,
      align: 'center',
    },
    {
      title: '日志类型',
      dataIndex: 'logType',
      width: 120,
      filters: true,
      valueEnum: {
        success: { text: '登录成功', status: 'Success' },
        fail: { text: '登录失败', status: 'Error' },
      },
      align: 'center',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      width: 150,
      align: 'center',
    },
    {
      title: '操作详情',
      dataIndex: 'description',
      ellipsis: true,
      align: 'center',
    },
  ];

  // 模拟后端请求函数
  const fetchLogs = async (params, sort, filter) => {
    console.log('请求参数:', params, sort, filter);

    // 真实场景应调用接口，例如：
    // return request('/api/login-logs', { params, sort, filter });

    // 模拟返回数据
    const pageSize = params.pageSize || 10;
    const current = params.current || 1;
    const total = 50;

    const data = new Array(pageSize).fill(0).map((_, i) => ({
      id: (current - 1) * pageSize + i + 1,
      timestamp: new Date(Date.now() - i * 3600 * 1000),
      username: `user${i + 1}`,
      logType: i % 2 === 0 ? 'success' : 'fail',
      ip: `192.168.0.${i + 1}`,
      description: `用户${i + 1}登录系统`,
    }));

    return {
      data,
      success: true,
      total,
    };
  };

  return (
    <PageContainer
      className={styles.pageContainer}
      header={{
        title: false,
      }}
    >
      <ProTable
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
                formProps.form.resetFields();
                setFilters({ dateRange: [], logType: undefined });
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
      />
    </PageContainer>
  );
};

export default withAuth(Operate);
