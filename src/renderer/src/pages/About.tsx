import React, { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Button,
  Divider,
  Descriptions,
  Alert
} from 'antd'
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
  BugOutlined,
  TeamOutlined,
  HeartOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface StorageInfo {
  totalSize: number
  dbSize: number
  backupSize: number
  exportSize: number
  dbPath: string
  backupPath: string
  exportPath: string
}

interface SystemInfo {
  version: string
  electronVersion: string
  platform: string
  arch: string
}

const About: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [integrityStatus] = useState<{
    isValid: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    loadStorageInfo()
    loadSystemInfo()
    checkDatabaseIntegrity()
  }, [])

  const loadStorageInfo = async (): Promise<void> => {
    try {
      const result = await window.api.getStorageInfo()
      if (result.success) {
        setStorageInfo(result.data || null)
      }
    } catch (error) {
      console.error('加载存储信息失败:', error)
    }
  }

  const loadSystemInfo = async (): Promise<void> => {
    try {
      // 这里需要添加获取系统信息的API
      setSystemInfo({
        version: '1.0.0',
        electronVersion: '25.0.0',
        platform: navigator.platform,
        arch: 'x64'
      })
    } catch (error) {
      console.error('加载系统信息失败:', error)
    }
  }

  const checkDatabaseIntegrity = async (): Promise<void> => {
    try {
      // 云端模式下不检查本地数据库完整性
      console.log('云端模式：跳过数据库完整性检查')
      // const result = await window.api.checkDatabaseIntegrity()
      // if (result.success) {
      //   setIntegrityStatus(result.data || null)
      // }
    } catch (error) {
      console.error('检查数据库完整性失败:', error)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const openDataFolder = (): void => {
    if (storageInfo && storageInfo.dbPath) {
      window.api.openPath(storageInfo.dbPath).catch((error) => {
        console.error('打开数据文件夹失败:', error)
      })
    }
  }

  return (
    <div className="page-container">
      <Title level={2}>关于 PetLink 宠联联</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="系统信息" variant="outlined">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Title level={4}>软件信息</Title>
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="版本">
                    <Tag color="blue">{systemInfo?.version || '1.0.0'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Electron版本">
                    <Tag color="green">{systemInfo?.electronVersion || '25.0.0'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="运行平台">
                    <Tag color="orange">{systemInfo?.platform || 'Windows'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="系统架构">
                    <Tag color="purple">{systemInfo?.arch || 'x64'}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <Divider />

              <div>
                <Title level={4}>数据库状态</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Card size="small">
                      <Statistic
                        title="数据库大小"
                        value={storageInfo?.dbSize || 0}
                        suffix="B"
                        formatter={(value) => formatSize(Number(value))}
                        prefix={<DatabaseOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card size="small">
                      <Statistic
                        title="备份文件大小"
                        value={storageInfo?.backupSize || 0}
                        suffix="B"
                        formatter={(value) => formatSize(Number(value))}
                        prefix={<DatabaseOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {integrityStatus && (
                  <Alert
                    message={integrityStatus.isValid ? '数据库正常' : '数据库异常'}
                    description={integrityStatus.message}
                    type={integrityStatus.isValid ? 'success' : 'error'}
                    showIcon
                    icon={
                      integrityStatus.isValid ? (
                        <CheckCircleOutlined />
                      ) : (
                        <ExclamationCircleOutlined />
                      )
                    }
                    style={{ marginTop: 16 }}
                  />
                )}
              </div>

              <Divider />

              <div>
                <Title level={4}>数据存储路径</Title>
                {storageInfo ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      message="数据库路径"
                      description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text copyable={{ text: storageInfo.dbPath }}>{storageInfo.dbPath}</Text>
                          <Button
                            type="link"
                            icon={<FolderOpenOutlined />}
                            onClick={openDataFolder}
                            size="small"
                          >
                            打开数据文件夹
                          </Button>
                        </Space>
                      }
                      type="info"
                      showIcon
                    />

                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="备份目录">
                        <Text copyable={{ text: storageInfo.backupPath }}>
                          {storageInfo.backupPath}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="导出目录">
                        <Text copyable={{ text: storageInfo.exportPath }}>
                          {storageInfo.exportPath}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                ) : (
                  <div>加载中...</div>
                )}
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="系统特性" variant="outlined">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Title level={4}>核心功能</Title>
                <Space direction="vertical" size="small">
                  <Text>
                    <HeartOutlined /> 宠物健康档案管理
                  </Text>
                  <Text>
                    <TeamOutlined /> 客户信息管理
                  </Text>
                  <Text>
                    <DatabaseOutlined /> 数据备份与恢复
                  </Text>
                  <Text>
                    <BugOutlined /> AI健康分析
                  </Text>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={4}>技术栈</Title>
                <Space direction="vertical" size="small">
                  <Text>• Electron - 跨平台桌面应用</Text>
                  <Text>• React - 用户界面框架</Text>
                  <Text>• Ant Design - UI组件库</Text>
                  <Text>• SQLite - 数据库存储</Text>
                  <Text>• TypeScript - 类型安全</Text>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={4}>数据安全</Title>
                <Space direction="vertical" size="small">
                  <Text>✅ 本地数据存储</Text>
                  <Text>✅ 自动备份机制</Text>
                  <Text>✅ 数据完整性检查</Text>
                  <Text>✅ 加密传输支持</Text>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="使用说明" variant="outlined" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Title level={4}>快速开始</Title>
            <ol>
              <Descriptions.Item label="客户管理">
                在&quot;客户管理&quot;中添加客户信息
              </Descriptions.Item>
              <Descriptions.Item label="宠物档案">
                在&quot;宠物档案&quot;中为每个客户添加宠物
              </Descriptions.Item>
              <Descriptions.Item label="健康检测">
                使用&quot;健康检测&quot;记录宠物健康检查
              </Descriptions.Item>
              <Descriptions.Item label="AI报告">
                查看&quot;AI报告&quot;获得智能分析
              </Descriptions.Item>
              <Descriptions.Item label="数据备份">
                定期在&quot;设置&quot;中备份数据
              </Descriptions.Item>
            </ol>
          </div>

          <Divider />

          <div>
            <Title level={4}>注意事项</Title>
            <ul>
              <li>数据库文件存储在系统用户数据目录中</li>
              <li>建议定期备份数据以防意外丢失</li>
              <li>导入数据时会覆盖现有数据，请谨慎操作</li>
              <li>如遇到问题，请检查数据库完整性</li>
            </ul>
          </div>
        </Space>
      </Card>

      <Card title="版本信息" variant="outlined" style={{ marginTop: 16 }}>
        <Descriptions column={3} bordered>
          <Descriptions.Item label="当前版本">1.0.0</Descriptions.Item>
          <Descriptions.Item label="构建日期">2024-01-01</Descriptions.Item>
          <Descriptions.Item label="最后更新">2024-01-01</Descriptions.Item>
          <Descriptions.Item label="许可证">MIT</Descriptions.Item>
          <Descriptions.Item label="开发者">PetLink Team</Descriptions.Item>
          <Descriptions.Item label="支持邮箱">support@petlink.com</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default About
