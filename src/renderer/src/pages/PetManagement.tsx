import React, { useState, useEffect } from 'react'
import { Button, Table, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'

const { Option } = Select

// 使用 preload 中定义的类型
interface Pet {
  id: string
  name: string
  type: 'dog' | 'cat' | 'horse' | 'other'
  breed: string
  age: number
  weight: number
  gender: 'male' | 'female'
  ownerId: string
  ownerName?: string
  avatar?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface Client {
  id: string
  name: string
  phone: string
  wechat?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  pet_count?: number
}

const PetManagement: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadPets()
    loadClients()
  }, [])

  const loadPets = async (): Promise<void> => {
    setLoading(true)
    try {
      const response = await window.api.getPets()
      if (response.success && response.data) {
        setPets(response.data)
      } else {
        message.error(response.error || '加载宠物列表失败')
      }
    } catch (error) {
      console.error('加载宠物列表失败:', error)
      message.error('加载宠物列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async (): Promise<void> => {
    try {
      const response = await window.api.getClients()
      if (response.success && response.data) {
        setClients(response.data)
      } else {
        message.error(response.error || '加载客户列表失败')
      }
    } catch (error) {
      console.error('加载客户列表失败:', error)
      message.error('加载客户列表失败')
    }
  }

  const handleAdd = (): void => {
    setEditingPet(null)
    setModalVisible(true)
    form.resetFields()
  }

  const handleEdit = (pet: Pet): void => {
    setEditingPet(pet)
    setModalVisible(true)
    form.setFieldsValue(pet)
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await window.api.deletePet(id)
      setPets(pets.filter((pet) => pet.id !== id))
      message.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handleSubmit = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      if (editingPet) {
        const response = await window.api.updatePet(editingPet.id, values)
        if (response.success && response.data) {
          setPets(pets.map((pet) => (pet.id === editingPet.id ? response.data! : pet)))
          message.success('更新成功')
        }
      } else {
        const response = await window.api.createPet(values)
        if (response.success && response.data) {
          setPets([...pets, response.data])
          message.success('添加成功')
        }
      }
      setModalVisible(false)
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '宠物名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap = { dog: '狗', cat: '猫', horse: '马', other: '其他' }
        return typeMap[type as keyof typeof typeMap] || type
      }
    },
    {
      title: '品种',
      dataIndex: 'breed',
      key: 'breed'
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: '体重(kg)',
      dataIndex: 'weight',
      key: 'weight'
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (gender === 'male' ? '雄性' : '雌性')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Pet) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个宠物吗？"
            onConfirm={() => handleDelete(record.id)}
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

  const filteredPets = pets.filter(
    (pet) =>
      pet.name.toLowerCase().includes(searchText.toLowerCase()) ||
      pet.type.toLowerCase().includes(searchText.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="搜索宠物..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加宠物
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPets}
        rowKey="id"
        loading={loading}
        pagination={{
          total: filteredPets.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      <Modal
        title={editingPet ? '编辑宠物' : '添加宠物'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="宠物名称"
            rules={[{ required: true, message: '请输入宠物名称' }]}
          >
            <Input placeholder="请输入宠物名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="宠物类型"
            rules={[{ required: true, message: '请选择宠物类型' }]}
          >
            <Select placeholder="请选择宠物类型">
              <Option value="dog">狗</Option>
              <Option value="cat">猫</Option>
              <Option value="horse">马</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item name="breed" label="品种" rules={[{ required: true, message: '请输入品种' }]}>
            <Input placeholder="请输入品种" />
          </Form.Item>

          <Form.Item name="age" label="年龄" rules={[{ required: true, message: '请输入年龄' }]}>
            <Input type="number" placeholder="请输入年龄" />
          </Form.Item>

          <Form.Item
            name="weight"
            label="体重(kg)"
            rules={[{ required: true, message: '请输入体重' }]}
          >
            <Input type="number" placeholder="请输入体重" />
          </Form.Item>

          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select placeholder="请选择性别">
              <Option value="male">雄性</Option>
              <Option value="female">雌性</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="ownerId"
            label="所属客户"
            rules={[{ required: true, message: '请选择所属客户' }]}
          >
            <Select placeholder="请选择所属客户">
              {clients.map((client) => (
                <Option key={client.id} value={client.id}>
                  {client.name} - {client.phone}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PetManagement
