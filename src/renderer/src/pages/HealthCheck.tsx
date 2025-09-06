import React, { useState, useEffect } from 'react'
import { Typography, Steps, Button, Card, Form, Upload, Select, message } from 'antd'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { Step } = Steps
const { Option } = Select

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
  createdAt?: Date
}

interface UploadFile {
  uid: string
  name: string
  status?: string
  size?: number
  originFileObj?: File
}

interface ReportStatus {
  task_id: string
  status: 'processing' | 'completed' | 'failed'
  message: string
  progress?: number
  result?: {
    filename: string
    mode: string
    processing_time: string
  }
  pdf_url?: string
}

const HealthCheck: React.FC = () => {
  const [current, setCurrent] = useState(0)
  const [form] = Form.useForm()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)
  const [reportTaskId, setReportTaskId] = useState<string | null>(null)
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null)
  const [reportReady, setReportReady] = useState(false)

  // 加载数据
  useEffect(() => {
    loadPetsAndClients()
  }, [])

  const loadPetsAndClients = async (): Promise<void> => {
    try {
      setLoading(true)
      const [petsRes, clientsRes] = await Promise.all([
        window.api.getPets(),
        window.api.getClients()
      ])
      if (petsRes.success && petsRes.data) {
        const petsWithOwner = petsRes.data.map((pet) => {
          const owner = clientsRes.data?.find((client) => client.id === pet.ownerId)
          return { ...pet, ownerName: owner?.name }
        })
        setPets(petsWithOwner)
      }
    } catch (error) {
      message.error('加载数据失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handlePetSelect = (petId: string): void => {
    const pet = pets.find((p) => p.id === petId)
    setSelectedPet(pet || null)
  }

  // AI报告生成函数
  const generateAIReport = async (): Promise<void> => {
    if (!uploadedFile) {
      message.error('请先上传Word文档')
      return
    }
    if (!uploadedFile.originFileObj) {
      message.error('文件对象无效，请重新选择')
      return
    }

    try {
      setReportGenerating(true)
      // 上传文件到AI API
      const formData = new FormData()
      formData.append('file', uploadedFile.originFileObj, uploadedFile.originFileObj.name)
      formData.append('mode', '健康关注')

      const uploadResponse = await fetch('https://api.chonglianlian.online/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败')
      }

      const uploadResult = await uploadResponse.json()
      setReportTaskId(uploadResult.task_id)
      message.success('文件上传成功，开始生成报告...')

      // 开始轮询状态
      pollReportStatus(uploadResult.task_id)
    } catch (error) {
      message.error('生成报告失败: ' + (error as Error).message)
      setReportGenerating(false)
    }
  }

  // 轮询报告生成状态
  const pollReportStatus = async (taskId: string): Promise<void> => {
    const maxAttempts = 60 // 最多尝试60次
    const interval = 5000 // 每5秒查询一次

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`https://api.chonglianlian.online/api/status/${taskId}`)
        const status = await response.json()
        setReportStatus(status)

        if (status.status === 'completed') {
          setReportReady(true)
          setReportGenerating(false)
          message.success('报告生成完成！')
          return
        } else if (status.status === 'failed') {
          throw new Error('报告生成失败')
        }

        // 等待下一次查询
        await new Promise((resolve) => setTimeout(resolve, interval))
      } catch (error) {
        message.error('查询状态失败: ' + (error as Error).message)
        setReportGenerating(false)
        return
      }
    }

    message.error('报告生成超时，请重试')
    setReportGenerating(false)
  }

  // 下载报告
  const downloadReport = async (): Promise<void> => {
    if (!reportTaskId) return

    try {
      const response = await fetch(`https://api.chonglianlian.online/api/download/${reportTaskId}`)

      if (!response.ok) {
        throw new Error('下载失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedPet?.name}_健康报告.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      message.success('报告下载成功！')
    } catch (error) {
      message.error('下载失败: ' + (error as Error).message)
    }
  }

  const next = (): void => {
    if (current === 0 && !selectedPet) {
      message.warning('请先选择宠物')
      return
    }
    if (current === 1 && !uploadedFile) {
      message.warning('请先上传Word文档')
      return
    }
    setCurrent(current + 1)
  }

  const prev = (): void => {
    setCurrent(current - 1)
  }

  const steps = [
    {
      title: '选择宠物',
      content: (
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <Title level={4} style={{ marginBottom: 24 }}>
            请选择需要生成AI报告的宠物
          </Title>
          <Form.Item>
            <Select
              placeholder="选择宠物种类"
              loading={loading}
              value={selectedPet?.id}
              onChange={handlePetSelect}
              style={{ width: '100%', fontSize: '16px' }}
              size="large"
            >
              {pets.map((pet) => (
                <Option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.ownerName}) - {pet.breed} - {pet.age}岁
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedPet && (
            <Card size="small" style={{ marginTop: 24, textAlign: 'left' }}>
              <Title level={5}>已选择宠物信息</Title>
              <p>
                <strong>姓名：</strong>
                {selectedPet.name}
              </p>
              <p>
                <strong>品种：</strong>
                {selectedPet.breed}
              </p>
              <p>
                <strong>年龄：</strong>
                {selectedPet.age}岁
              </p>
              <p>
                <strong>性别：</strong>
                {selectedPet.gender === 'male' ? '雄性' : '雌性'}
              </p>
              <p>
                <strong>体重：</strong>
                {selectedPet.weight}kg
              </p>
              <p>
                <strong>主人：</strong>
                {selectedPet.ownerName}
              </p>
            </Card>
          )}

          {selectedPet && (
            <Button type="primary" size="large" onClick={next} style={{ marginTop: 24 }}>
              下一步：上传文档
            </Button>
          )}
        </div>
      )
    },
    {
      title: '上传文档',
      content: (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ width: '500px', textAlign: 'center' }}>
            <Title level={4} style={{ marginBottom: 24 }}>上传包含宠物信息的Word文档</Title>
            <Upload.Dragger
              name="healthReport"
              accept=".docx"
              beforeUpload={(file) => {
                if (!file.name.endsWith('.docx')) {
                  message.error('只支持.docx格式的Word文档')
                  return false
                }
                return false
              }}
              maxCount={1}
              onChange={(info) => {
                if (info.fileList.length > 0) {
                  setUploadedFile(info.fileList[0])
                  // 重置报告状态
                  setReportGenerating(false)
                  setReportTaskId(null)
                  setReportStatus(null)
                  setReportReady(false)
                } else {
                  setUploadedFile(null)
                }
              }}
              style={{ padding: '40px 20px', backgroundColor: '#fafafa' }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p
                className="ant-upload-text"
                style={{ fontSize: '16px', color: '#333', margin: '16px 0 8px' }}
              >
                点击或拖拽Word文档到此区域上传
              </p>
              <p className="ant-upload-hint" style={{ color: '#666' }}>
                支持.docx格式，文件大小不超过10MB
              </p>
            </Upload.Dragger>

            {uploadedFile && (
              <div style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    generateAIReport()
                    setCurrent(2)
                  }}
                  style={{ marginRight: 16 }}
                >
                  开始生成AI报告
                </Button>
                <Button size="large" onClick={prev}>
                  上一步
                </Button>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: '报告处理',
      content: (
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          {reportGenerating && (
            <div>
              <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }}>⚡</div>
              <Title level={3}>AI正在分析生成报告...</Title>
              <Paragraph style={{ fontSize: '16px', color: '#666' }}>
                正在为 {selectedPet?.name} 生成专业的健康分析报告，请稍候
              </Paragraph>

              {reportStatus && (
                <div style={{ marginTop: 24, padding: 20, backgroundColor: '#f0f8ff', borderRadius: 8 }}>
                  <p>
                    <strong>状态：</strong>
                    {reportStatus.status === 'processing' ? '处理中' : reportStatus.status}
                  </p>
                  {reportStatus.progress && (
                    <p>
                      <strong>进度：</strong>
                      {reportStatus.progress}%
                    </p>
                  )}
                  <p><strong>消息：</strong>{reportStatus.message}</p>
                </div>
              )}
            </div>
          )}

          {reportReady && (
            <div>
              <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }}>✓</div>
              <Title level={3} style={{ color: '#52c41a' }}>AI报告生成完成！</Title>
              <Paragraph style={{ fontSize: '16px', marginBottom: 32 }}>
                {selectedPet?.name} 的AI健康分析报告已生成完成，您可以下载PDF查看详细内容
              </Paragraph>

              <div style={{ marginBottom: 24 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={downloadReport}
                  style={{ marginRight: 16, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  下载AI健康报告 (PDF)
                </Button>
              </div>

              <div>
                <Button
                  type="primary"
                  onClick={() => {
                    // 重置所有状态
                    form.resetFields()
                    setSelectedPet(null)
                    setUploadedFile(null)
                    setReportGenerating(false)
                    setReportTaskId(null)
                    setReportStatus(null)
                    setReportReady(false)
                    setCurrent(0)
                  }}
                  style={{ marginRight: 16 }}
                >
                  生成新报告
                </Button>
                <Button onClick={() => window.location.href = '#/dashboard'}>
                  返回首页
                </Button>
              </div>
            </div>
          )}

          {!reportGenerating && !reportReady && (
            <div>
              <Title level={4}>准备生成报告</Title>
              <Paragraph>请确认信息无误后开始生成AI报告</Paragraph>
              <Button onClick={prev}>返回上一步</Button>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="page-container">
      <Title level={2}>宠物AI健康报告生成</Title>
      <Paragraph>通过AI智能分析为您的宠物生成专业的健康报告，只需三个简单步骤。</Paragraph>

      <Card bordered={false} style={{ marginTop: 24 }}>
        <Steps current={current} style={{ marginBottom: 32 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <div className="steps-content">{steps[current].content}</div>
      </Card>
    </div>
  )
}

export default HealthCheck
