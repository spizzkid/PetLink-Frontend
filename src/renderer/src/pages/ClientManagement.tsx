import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Popconfirm
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
// 与 preload 中保持一致的最小 Client 类型（仅页面需要的字段）
interface Client {
  id: string
  name: string
  phone: string
  wechat?: string
  address?: string
  createdAt?: Date
}

const { Title } = Typography
const { Search } = Input

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [form] = Form.useForm()

  // 加载客户数据
  const loadClients = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await window.api.getClients()
      if (res.success && res.data) {
        setClients(res.data)
      } else {
        message.error('加载客户数据失败')
      }
    } catch (error) {
      message.error('加载客户数据失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    void loadClients()
  }, [])

  // 搜索客户
  const handleSearch = (value: string): void => {
    if (value.trim()) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(value.toLowerCase()) ||
          client.phone.includes(value) ||
          (client.wechat && client.wechat.toLowerCase().includes(value.toLowerCase()))
      )
      setClients(filtered)
    } else {
      loadClients()
    }
  }

  // 打开模态框
  const openModal = (client?: Client): void => {
    setCurrentClient(client || null)
    if (client) {
      form.setFieldsValue(client)
    } else {
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  // 处理模态框确认
  const handleModalOk = async (): Promise<void> => {
    try {
      const values = await form.validateFields()

      if (currentClient && currentClient.id) {
        // 编辑现有客户
        await window.api.updateClient(currentClient.id, values)
        message.success('客户更新成功')
      } else {
        // 添加新客户
        await window.api.createClient(values)
        message.success('客户添加成功')
      }

      setIsModalVisible(false)
      loadClients()
    } catch (error) {
      message.error('操作失败: ' + (error as Error).message)
    }
  }

  // 删除客户
  const handleDeleteClient = async (clientId: string): Promise<void> => {
    try {
      await window.api.deleteClient(clientId)
      message.success('客户删除成功')
      loadClients()
    } catch (error) {
      message.error('删除失败: ' + (error as Error).message)
    }
  }

  // 表格列定义
  const columns: ColumnsType<Client> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Client, b: Client) => a.name.localeCompare(b.name)
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '微信号',
      dataIndex: 'wechat',
      key: 'wechat',
      render: (wechat: string) => wechat || '-'
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => address || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => (date ? new Date(date).toLocaleDateString() : '-'),
      sorter: (a: Client, b: Client) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Client) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个客户吗？"
            onConfirm={() => record.id && handleDeleteClient(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={2}>客户管理</Title>
          <Space style={{ marginBottom: 16 }}>
            <Search
              placeholder="搜索客户姓名、手机号或微信号"
              allowClear
              enterButton="搜索"
              size="large"
              onSearch={handleSearch}
              style={{ width: 400 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              添加客户
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadClients}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={clients}
          loading={loading}
          rowKey="id"
          pagination={{
            total: clients.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title={currentClient ? '编辑客户' : '添加客户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        forceRender
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: '',
            phone: '',
            wechat: '',
            address: '',
            notes: ''
          }}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item name="wechat" label="微信号">
            <Input placeholder="请输入微信号（可选）" />
          </Form.Item>

          <Form.Item name="address" label="地址">
            <Input.TextArea placeholder="请输入地址（可选）" rows={3} />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea placeholder="请输入备注（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ClientManagement
