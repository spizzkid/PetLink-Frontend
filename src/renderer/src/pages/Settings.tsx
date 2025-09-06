import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  message,
  Divider,
  Typography,
  Statistic,
  Row,
  Col,
  Alert,
  Table,
  Modal,
  Popconfirm
} from 'antd'
import {
  DatabaseOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  FolderOpenOutlined
} from '@ant-design/icons'
import NetworkDiagnostics from '../components/NetworkDiagnostics'

const { Title, Paragraph } = Typography

interface StorageInfo {
  totalSize: number
  dbSize: number
  backupSize: number
  exportSize: number
  dbPath: string
  backupPath: string
  exportPath: string
}

interface BackupItem {
  path: string
  name: string
  size: number
  date: string
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [backupList, setBackupList] = useState<BackupItem[]>([])
  const [integrityStatus, setIntegrityStatus] = useState<{
    isValid: boolean
    message: string
  } | null>(null)
  const [integrityLoading, setIntegrityLoading] = useState(false)

  useEffect(() => {
    loadStorageInfo()
    loadBackupList()
  }, [])

  const loadStorageInfo = async (): Promise<void> => {
    try {
      const result = await window.api.getStorageInfo()
      if (result.success) {
        setStorageInfo(result.data || null)
      }
    } catch {
      message.error('加载存储信息失败')
    }
  }

  const loadBackupList = async (): Promise<void> => {
    try {
      const result = await window.api.getBackupList()
      if (result.success && result.data) {
        setBackupList(result.data)
      }
    } catch {
      message.error('加载备份列表失败')
    }
  }

  const handleCreateBackup = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.createBackup()
      if (result.success) {
        message.success('备份创建成功')
        loadStorageInfo()
        loadBackupList()
      } else {
        message.error(result.error)
      }
    } catch {
      message.error('备份创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.exportData()
      if (result.success) {
        message.success('数据导出成功')
        loadStorageInfo()
      } else {
        message.error(result.error)
      }
    } catch {
      message.error('数据导出失败')
    } finally {
      setLoading(false)
    }
  }

  const handleImportData = async (): Promise<void> => {
    // 这里需要实现文件选择对话框
    Modal.confirm({
      title: '确认导入数据',
      content: '导入数据将覆盖现有数据，请确保已备份重要数据。是否继续？',
      onOk: async () => {
        // 实际实现中需要先选择文件
        message.info('请选择要导入的数据文件')
      }
    })
  }

  const handleDeleteBackup = async (backupPath: string): Promise<void> => {
    try {
      const result = await window.api.deleteBackup(backupPath)
      if (result.success) {
        message.success('备份删除成功')
        loadBackupList()
        loadStorageInfo()
      } else {
        message.error(result.error)
      }
    } catch {
      message.error('备份删除失败')
    }
  }

  const handleCleanupOldBackups = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.cleanupOldBackups(10)
      if (result.success) {
        message.success('旧备份清理完成')
        loadBackupList()
        loadStorageInfo()
      } else {
        message.error(result.error)
      }
    } catch {
      message.error('清理失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIntegrity = async (): Promise<void> => {
    setIntegrityLoading(true)
    try {
      const result = await window.api.checkDatabaseIntegrity()
      if (result.success && result.data) {
        setIntegrityStatus(result.data)
        if (result.data.isValid) {
          message.success('数据库完整性检查通过')
        } else {
          message.error(result.data.message)
        }
      } else {
        message.error(result.error || '检查失败')
      }
    } catch {
      message.error('完整性检查失败')
    } finally {
      setIntegrityLoading(false)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const backupColumns = [
    {
      title: '备份文件名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <DatabaseOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatSize(size)
    },
    {
      title: '创建时间',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: BackupItem) => (
        <Space>
          <Button
            type="link"
            icon={<FolderOpenOutlined />}
            onClick={() => {
              // window.api.openPath(record.path) - API 方法不存在，暂时禁用
              message.info('打开文件功能暂未实现')
            }}
          >
            打开
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个备份文件吗？"
            onConfirm={() => handleDeleteBackup(record.path)}
            okText="是"
            cancelText="否"
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
    <div className="page-container">
      <Title level={2}>系统设置</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="数据存储信息" bordered={false}>
            {storageInfo ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="数据库大小"
                      value={storageInfo.dbSize}
                      suffix="B"
                      formatter={(value) => formatSize(Number(value))}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="备份文件大小"
                      value={storageInfo.backupSize}
                      suffix="B"
                      formatter={(value) => formatSize(Number(value))}
                    />
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="导出文件大小"
                      value={storageInfo.exportSize}
                      suffix="B"
                      formatter={(value) => formatSize(Number(value))}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="总存储大小"
                      value={storageInfo.totalSize}
                      suffix="B"
                      formatter={(value) => formatSize(Number(value))}
                    />
                  </Col>
                </Row>

                <Divider />

                <div>
                  <Title level={4}>存储路径</Title>
                  <Paragraph copyable={{ text: storageInfo.dbPath }}>
                    <strong>数据库:</strong> {storageInfo.dbPath}
                  </Paragraph>
                  <Paragraph copyable={{ text: storageInfo.backupPath }}>
                    <strong>备份目录:</strong> {storageInfo.backupPath}
                  </Paragraph>
                  <Paragraph copyable={{ text: storageInfo.exportPath }}>
                    <strong>导出目录:</strong> {storageInfo.exportPath}
                  </Paragraph>
                </div>
              </Space>
            ) : (
              <div>加载中...</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="数据库完整性" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
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
                />
              )}

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={integrityLoading}
                onClick={handleCheckIntegrity}
                block
              >
                检查数据库完整性
              </Button>

              <Alert
                message="完整性检查"
                description="数据库完整性检查可以检测数据文件是否损坏，确保数据安全。"
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="数据备份与导出" bordered={false} style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="primary"
                icon={<DatabaseOutlined />}
                loading={loading}
                onClick={handleCreateBackup}
                block
              >
                创建备份
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button icon={<ExportOutlined />} loading={loading} onClick={handleExportData} block>
                导出数据
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button icon={<ImportOutlined />} onClick={handleImportData} block>
                导入数据
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={handleCleanupOldBackups}
                block
              >
                清理旧备份
              </Button>
            </Col>
          </Row>

          <Alert
            message="数据安全提示"
            description="定期备份数据可以防止意外数据丢失。建议每周至少备份一次，并将备份文件保存到安全的位置。"
            type="warning"
            showIcon
          />
        </Space>
      </Card>

      <Card title="备份文件列表" bordered={false} style={{ marginTop: 16 }}>
        <Table
          columns={backupColumns}
          dataSource={backupList}
          rowKey="path"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无备份文件' }}
        />
      </Card>

      <NetworkDiagnostics />
    </div>
  )
}

export default Settings
