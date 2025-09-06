import React, { useEffect, useMemo, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tabs, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UserOutlined, TeamOutlined, ShopOutlined, HeartOutlined } from '@ant-design/icons'

import { useAuth } from '../contexts/AuthContext'

const { TabPane } = Tabs

// 类型定义
interface AdminStats {
  total_users: number
  total_clients: number
  total_pets: number
  active_users: number
  last_updated: string
}

interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'store'
  is_active: boolean
  created_at: string
}

interface Client {
  id: string
  name: string
  phone: string
  wechat?: string
  address?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

interface Pet {
  id: string
  name: string
  type?: string
  breed?: string
  age?: number
  ownerId: string
  createdAt?: string
}

const AdminDashboard: React.FC = () => {
  // state
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)

  // auth
  const { isAdmin } = useAuth()

  // data loader
  const loadAdminData = async (): Promise<void> => {
    setLoading(true)
    try {
      // 使用 window.api 获取数据
      const [statsResponse, usersResponse, clientsResponse, petsResponse] = await Promise.all([
        window.api.getAdminStats(),
        window.api.getUsers(),
        window.api.getClients(),
        window.api.getPets()
      ])

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as AdminStats)
      }
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data)
      }
      if (clientsResponse.success && clientsResponse.data) {
        setClients(clientsResponse.data)
      }
      if (petsResponse.success && petsResponse.data) {
        const mapped = petsResponse.data.map(
          (p: {
            id: string
            name: string
            type?: string
            breed?: string
            age?: number
            ownerId: string
            createdAt?: Date | string
          }) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            breed: p.breed,
            age: p.age,
            ownerId: p.ownerId,
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined
          })
        ) as Pet[]
        setPets(mapped)
      }
    } catch (error) {
      console.error('加载管理员数据失败:', error)
      message.error('加载管理员数据失败')
    } finally {
      setLoading(false)
    }
  }

  // effects must run unconditionally
  useEffect(() => {
    if (isAdmin()) {
      void loadAdminData()
    }
  }, [isAdmin])

  // columns
  const userColumns: ColumnsType<User> = useMemo(
    () => [
      { title: '用户名', dataIndex: 'username', key: 'username' },
      { title: '姓名', dataIndex: 'name', key: 'name' },
      { title: '邮箱', dataIndex: 'email', key: 'email' },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        render: (role: string) => (
          <span style={{ color: role === 'admin' ? '#f50' : '#108ee9', fontWeight: 'bold' }}>
            {role === 'admin' ? '管理员' : '店铺用户'}
          </span>
        )
      },
      {
        title: '状态',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (isActive: boolean) => (
          <span style={{ color: isActive ? '#52c41a' : '#f50' }}>{isActive ? '激活' : '禁用'}</span>
        )
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date: string) => (date ? new Date(date).toLocaleString() : '-')
      }
    ],
    []
  )

  const clientColumns: ColumnsType<Client> = useMemo(
    () => [
      { title: '客户姓名', dataIndex: 'name', key: 'name' },
      { title: '手机号', dataIndex: 'phone', key: 'phone' },
      { title: '微信号', dataIndex: 'wechat', key: 'wechat', render: (w?: string) => w || '-' },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date?: string) => (date ? new Date(date).toLocaleString() : '-')
      }
    ],
    []
  )

  const petColumns: ColumnsType<Pet> = useMemo(
    () => [
      { title: '宠物名称', dataIndex: 'name', key: 'name' },
      {
        title: '物种',
        dataIndex: 'type',
        key: 'type',
        render: (type?: string) => {
          const map = { dog: '狗', cat: '猫', horse: '马', other: '其他' } as const
          return type ? (map[type as keyof typeof map] ?? type) : '-'
        }
      },
      { title: '品种', dataIndex: 'breed', key: 'breed', render: (b?: string) => b || '-' },
      { title: '年龄', dataIndex: 'age', key: 'age', render: (a?: number) => (a ? `${a}岁` : '-') }
    ],
    []
  )

  return (
    <div style={{ padding: 24 }}>
      {!isAdmin() ? (
        <div style={{ textAlign: 'center' }}>
          <h2>权限不足</h2>
          <p>只有管理员可以访问此页面</p>
        </div>
      ) : (
        <>
          <h1>管理员控制台</h1>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={stats?.total_users ?? 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总客户数"
                  value={stats?.total_clients ?? 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总宠物数"
                  value={stats?.total_pets ?? 0}
                  prefix={<HeartOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={stats?.active_users ?? 0}
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Card>
            <Tabs defaultActiveKey="users">
              <TabPane tab="用户管理" key="users">
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
              <TabPane tab="所有客户" key="clients">
                <Table
                  columns={clientColumns}
                  dataSource={clients}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
              <TabPane tab="所有宠物" key="pets">
                <Table
                  columns={petColumns}
                  dataSource={pets}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
