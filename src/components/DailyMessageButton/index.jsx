import AccountApi from '@/api/AccountApi';
import { getUsername } from '@/utils/tokenUtil';
import { BellOutlined } from '@ant-design/icons';
import {
  LightFilter,
  ModalForm,
  ProFormFieldSet,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import ProTable from '@ant-design/pro-table';
import { Button, Space, Tag, Tooltip } from 'antd';
import { useRef, useState } from 'react';

const DailyMessageButton = () => {
  const [open, setOpen] = useState(false);
  const [assnPlaceholder, setAssnPlaceholder] =
    useState('消息标题模糊搜索(部分标题)');
  const [gysnPlaceholder, setGysnPlaceholder] =
    useState('光宇编号模糊搜索(部分编号)');
  const [notifyUserOptions, setNotifyUserOptions] = useState([]);
  const [numberOfType, setNumberOfType] = useState({
    untreated: 0,
    processed: 0,
  });
  const [filterParams, setFilterParams] = useState({});
  const actionTableRef = useRef();

  const columns = [
    {
      title: '消息编号',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      fixed: 'left',
      width: 100,
    },
    {
      title: '消息标题',
      dataIndex: 'title',
      key: 'title',
      align: 'center',
      tooltip: '标题过长会自动收缩',
      copyable: true,
      ellipsis: true,
      width: '30%',
    },
    {
      title: '消息内容',
      dataIndex: 'content',
      key: 'content',
      align: 'center',
      tooltip: '消息内容会自动收缩',
      copyable: true,
      ellipsis: true,
      width: '30%',
    },
    {
      title: '通知人',
      dataIndex: 'notifyUser',
      key: 'notifyUser',
      align: 'center',
      width: 150,
    },
    {
      title: <b>状态</b>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      fixed: 'center',
      filters: true,
      ellipsis: true,
      valueType: 'select',
      width: 100,
      valueEnum: {
        0: {
          text: `待处理 (${numberOfType?.untreated})`,
          status: 'Error',
        },
        1: {
          text: `已处理 (${numberOfType?.processed})`,
          status: 'Success',
        },
      },
      render: (text, record, _, action) => {
        return (
          <Tag
            key={record.id}
            style={{ color: record.status ? 'green' : 'red' }}
          >
            {record.status ? '已处理' : '待处理'}
          </Tag>
        );
      },
    },
    {
      title: '发布日期',
      fixed: 'center',
      dataIndex: 'createTime',
      key: 'createTime',
      valueType: 'dateTime',
      align: 'center',
      fieldProps: {
        format: 'YYYY-MM-DD HH:mm:ss',
      },
      sorter: (a, b) => a.createTime - b.createTime,
    },
    {
      title: <b>操作</b>,
      valueType: 'option',
      align: 'center',
      key: 'option',
      ellipsis: true,
      width: 100,
      fixed: 'right',
      render: (text, record, _, action) => (
        <Space>
          {record?.status ? (
            <Tooltip placement="top" title={'处理详情'}>
              <Button
                color="primary"
                variant="outlined"
                size="small"
                icon={<BellOutlined />}
                onClick={() => {
                  console.log(2);
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip placement="top" title={'消息处理'}>
              <Button
                color="primary"
                variant="outlined"
                size="small"
                icon={<BellOutlined />}
                onClick={() => {
                  console.log(1);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];
  const getMessageByUserName = async () => {
    const { success, data } =
      await AccountApi.getMessageByUserName(getUsername());
    if (success) {
      setNotifyUserOptions(data?.list);
    }
    setOpen(true);
  };

  const getMessageStatusInfo = async () => {
    const { success, data } =
      await AccountApi.getMessageStatusInfo(getUsername());
    if (success) {
      setNumberOfType(data?.data);
    }
    setOpen(true);
  };

  return (
    <>
      <Tooltip title={'消息通知'} placement="bottom">
        <Button
          type="text"
          onClick={() => {
            getMessageByUserName().then((r) => {});
            getMessageStatusInfo().then((r) => {});
          }}
          style={{
            paddingTop: 5,
            height: 'auto',
            color: 'inherit',
          }}
          className="custom-fullscreen-btn"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
        />
      </Tooltip>

      <ModalForm
        title="消息列表"
        open={open}
        width={1200}
        submitter={false}
        modalProps={{
          onCancel: () => setOpen(false),
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProTable
          tableAlertRender={false}
          columns={columns}
          request={async (params, sort, filter) => {
            if (sort?.createTime !== undefined) {
              sort.createTimeSort = sort?.createTime;
              delete sort.createTime;
            }
            const response = await AccountApi.queryDailyMessages({
              recipientUser: getUsername(),
              ...filterParams,
              ...params,
              ...sort,
              ...filter,
            });
            return {
              data: response.data.list.records,
              total: response.data.list.total,
              success: true,
            };
          }}
          actionRef={actionTableRef}
          rowKey={(record) => {
            return record.id;
          }}
          options={false}
          search={false}
          scroll={{ x: 500, y: 500 }}
          toolBarRender={() => (
            <LightFilter
              style={{ marginBottom: 15 }}
              onFinish={async (values) => {
                if (values?.title !== undefined) {
                  values.titleFlag =
                    values.title?.length === 1 ? false : values.title[1];
                  values.title = values.title[0];
                }
                if (values?.content !== undefined) {
                  values.contentFlag =
                    values.content?.length === 1 ? false : values.content[1];
                  values.content = values.content[0];
                }
                await setFilterParams(values);
                actionTableRef.current?.reload();
              }}
            >
              <ProFormFieldSet name="title" label="消息标题" type="group">
                <ProFormText label="消息标题" placeholder={assnPlaceholder} />
                <ProFormSwitch
                  checkedChildren="精准"
                  unCheckedChildren="精准"
                  fieldProps={{ style: { marginTop: 15 } }}
                  onChange={(value) =>
                    value
                      ? setAssnPlaceholder('消息标题(多个用,隔开)')
                      : setAssnPlaceholder('消息标题模糊搜索(部分标题)')
                  }
                />
              </ProFormFieldSet>
              <ProFormFieldSet name="content" label="消息内容" type="group">
                <ProFormText label="消息内容" placeholder={gysnPlaceholder} />
                <ProFormSwitch
                  checkedChildren="精准"
                  unCheckedChildren="精准"
                  fieldProps={{ style: { marginTop: 15 } }}
                  onChange={(value) =>
                    value
                      ? setGysnPlaceholder('消息内容精准搜索(多个用,隔开)')
                      : setGysnPlaceholder('消息内容模糊搜索(部分编号)')
                  }
                />
              </ProFormFieldSet>
              <ProFormSelect
                name="notifyUser"
                label="通知人"
                showSearch
                options={notifyUserOptions}
                placeholder="请选择负责人"
                mode={'single'}
              />
            </LightFilter>
          )}
          dateFormatter="string"
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: [10, 30, 50, 100],
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </ModalForm>
    </>
  );
};

export default DailyMessageButton;
