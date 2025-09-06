import React, { useEffect, useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  List,
  Tag,
  Button,
  Upload,
  message,
  Select,
  Modal,
  Form,
  Input,
  Progress,
  Space
} from 'antd'
import { UploadOutlined, PlusOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

// AI 健康报告服务基础 URL (.online + /api)
const AI_API_BASE = 'http://api.chonglianlian.online/api' // 临时改为 HTTP

// 任务类型（对齐 AI 文档）
type TaskStatus = 'processing' | 'completed' | 'failed' | 'pending'
interface AiTask {
  task_id: string
  status: TaskStatus
  progress?: number
  message?: string
  created_at?: string
  updated_at?: string
  file_name?: string
}

const AiReport: React.FC = () => {
  const [tasks, setTasks] = useState<AiTask[]>([])
  const [selectedTask, setSelectedTask] = useState<AiTask | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()

  // AI 接口无需认证

  useEffect(() => {
    const fetchTasks = async (): Promise<void> => {
      try {
        // 通过 IPC 走主进程 axios
        const res = await window.electron.ipcRenderer.invoke('api:request', {
          url: `${AI_API_BASE}/tasks?limit=50`,
          method: 'GET',
          responseType: 'json'
        })
        if (!res?.ok) throw new Error('获取任务列表失败')
        const data = res.data
        const list: AiTask[] = Array.isArray(data) ? data : data.tasks || []
        setTasks(list)
      } catch (e) {
        console.error(e)
        message.error('获取任务列表失败')
      }
    }

    void fetchTasks()
  }, [])

  const refreshTasks = async (): Promise<void> => {
    try {
      const res = await window.electron.ipcRenderer.invoke('api:request', {
        url: `${AI_API_BASE}/tasks?limit=50`,
        method: 'GET',
        responseType: 'json'
      })
      if (!res?.ok) throw new Error('获取任务列表失败')
      const data = res.data
      const list: AiTask[] = Array.isArray(data) ? data : data.tasks || []
      setTasks(list)
    } catch (e) {
      console.error(e)
      message.error('获取任务列表失败')
    }
  }

  const pollTaskUntilDone = async (taskId: string): Promise<void> => {
    const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
    while (true) {
      try {
        const res = await window.electron.ipcRenderer.invoke('api:request', {
          url: `${AI_API_BASE}/status/${taskId}`,
          method: 'GET',
          responseType: 'json'
        })
        if (!res?.ok) throw new Error('查询任务状态失败')
        const status: AiTask = res.data
        setTasks((prev) => {
          const next = [...prev]
          const idx = next.findIndex((t) => t.task_id === taskId)
          if (idx >= 0) next[idx] = { ...next[idx], ...status }
          else next.unshift(status)
          return next
        })
        if (status.status === 'completed' || status.status === 'failed') {
          break
        }
      } catch (e) {
        console.error(e)
        break
      }
      await sleep(2000)
    }
  }

  const handleFileUpload = async (file: File, mode: string): Promise<void> => {
    try {
      setUploading(true)
      // 通过 IPC 发送文件数据（ArrayBuffer）
      const arrayBuf = await file.arrayBuffer()
      const res = await window.electron.ipcRenderer.invoke('ai:upload', {
        url: `${AI_API_BASE}/upload`,
        fileBuffer: arrayBuf,
        fileName: file.name,
        mode
      })
      if (!res?.ok) throw new Error('上传失败')
      const data = res.data
      const taskId = data.task_id as string
      message.success('文件上传成功，开始分析...')
      void pollTaskUntilDone(taskId)
      setModalVisible(false)
      form.resetFields()
      void refreshTasks()
    } catch (e) {
      console.error(e)
      message.error('文件上传失败')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'processing':
        return 'blue'
      case 'pending':
        return 'orange'
      case 'failed':
        return 'red'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'processing':
        return '分析中'
      case 'pending':
        return '等待中'
      case 'failed':
        return '失败'
      default:
        return '未知'
    }
  }

  const renderTaskDetails = (task: AiTask): React.ReactNode => {
    if (!task) return null

    return (
      <div>
        <Title level={4}>任务详情</Title>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>任务ID:</Text> <Text>{task.task_id}</Text>
          </Col>
          <Col span={12}>
            <Text strong>文件名:</Text> <Text>{task.file_name || '-'}</Text>
          </Col>
          <Col span={12}>
            <Text strong>状态:</Text>{' '}
            <Tag color={getStatusColor(task.status)}>{getStatusText(task.status)}</Tag>
          </Col>
          <Col span={12}>
            <Text strong>创建时间:</Text>
            <Text>{task.created_at ? new Date(task.created_at).toLocaleString() : '-'}</Text>
          </Col>
        </Row>

        {task.status === 'processing' && typeof task.progress === 'number' && (
          <div style={{ marginTop: '16px' }}>
            <Text strong>分析进度:</Text>
            <Progress percent={task.progress} status="active" />
          </div>
        )}

        {task.status === 'completed' && (
          <div style={{ marginTop: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={async () => {
                    // 可选：走 IPC 下载并保存到下载目录
                    const res = await window.electron.ipcRenderer.invoke('ai:download', {
                      url: `${AI_API_BASE}/download/${task.task_id}`
                    })
                    if (res?.ok) {
                      message.success('报告已下载')
                    } else {
                      message.error('下载失败')
                    }
                  }}
                >
                  下载PDF报告
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>AI 报告中心</Title>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              新建分析
            </Button>
            <Button icon={<SyncOutlined />} onClick={refreshTasks} loading={loading}>
              刷新
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={16}>
          <Card title="任务列表" size="small">
            <List
              dataSource={tasks}
              renderItem={(task) => (
                <List.Item
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedTask(task)}
                    >
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {task.file_name || '未命名文件'}
                        <Tag color={getStatusColor(task.status)} style={{ marginLeft: 8 }}>
                          {getStatusText(task.status)}
                        </Tag>
                      </span>
                    }
                    description={`任务ID: ${task.task_id} · 创建时间: ${task.created_at ? new Date(task.created_at).toLocaleString() : '-'}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="任务详情" size="small">
            {selectedTask ? (
              renderTaskDetails(selectedTask)
            ) : (
              <div style={{ textAlign: 'center', color: '#999' }}>
                <Text>请选择一个报告查看详情</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="新建AI分析"
        open={modalVisible}
        onOk={form.submit}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const file: File | undefined = values.file?.file?.originFileObj
            const mode: string = values.mode
            if (!file) {
              message.error('请先选择文件')
              return
            }
            await handleFileUpload(file, mode)
          }}
        >
          <Form.Item label="分析模式" name="mode" initialValue="健康关注">
            <Select placeholder="请选择分析模式">
              <Option value="健康关注">健康关注</Option>
              <Option value="疾病诊断">疾病诊断</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="上传文件"
            name="file"
            rules={[{ required: true, message: '请上传文件' }]}
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                选择文件
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item label="备注（可选）" name="notes">
            <Input.TextArea rows={3} placeholder="填写备注信息（不提交到AI服务，仅本地记录）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AiReport
