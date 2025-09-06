import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Table,
  Button,
  DatePicker,
  Select,
  Input,
  Space,
  Tag,
  Tabs,
  message,
  Spin,
  Row,
  Col,
  List
} from 'antd'
import { FileTextOutlined, ReloadOutlined, LeftOutlined } from '@ant-design/icons'
import type { TabsProps, TableProps } from 'antd'
import type { HealthCheck } from '@shared/types'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

// 中文映射
const checkTypeMap = {
  routine: '常规体检',
  vaccination: '疫苗接种',
  skin: '皮肤检查',
  specialized: '专项检查',
  emergency: '急诊'
}

const statusMap = {
  scheduled: '已预约',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const statusColorMap = {
  scheduled: 'blue',
  in_progress: 'orange',
  completed: 'green',
  cancelled: 'red'
}

// 模拟AI报告数据
const generateAiReport = (
  healthCheck: HealthCheck
): {
  id: string
  petName: string | undefined
  petType: string | undefined
  date: string
  status: string
  highlights: string[]
  concerns: string[]
  detailedAnalysis: string
  suggestions: string[]
} => {
  const reports = [
    {
      id: healthCheck.id,
      petName: healthCheck.petName,
      petType: healthCheck.petType,
      date: dayjs(healthCheck.checkDate).format('YYYY-MM-DD'),
      status: healthCheck.status === 'completed' ? '健康' : '检查中',
      highlights: ['皮肤状况良好', '被毛光亮', '眼睛明亮'],
      concerns:
        healthCheck.diagnosis && healthCheck.diagnosis.includes('异常') ? ['需要进一步检查'] : [],
      detailedAnalysis: `根据AI分析，${healthCheck.petName}的整体健康状况良好。皮肤状态正常，被毛光泽，眼睛明亮有神，显示营养状况良好。`,
      suggestions: [
        '继续保持当前的喂养方案',
        '确保充足的运动时间，每天至少30分钟',
        '定期梳理被毛，保持皮肤健康',
        '6个月后建议进行下一次健康检测'
      ]
    }
  ]
  return reports[0]
}

const HealthReportCenter: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [checkType, setCheckType] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  >('all')
  const [selectedReport, setSelectedReport] = useState<ReturnType<typeof generateAiReport> | null>(
    null
  )
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list')

  // 加载健康检查数据
  const loadHealthChecks = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.getHealthChecks()
      if (result.success) {
        setHealthChecks(result.data || [])
      } else {
        message.error('加载健康检查数据失败: ' + result.error)
      }
    } catch (error) {
      message.error('加载健康检查数据失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadHealthChecks()
  }, [])

  // 处理检查类型变化
  const handleCheckTypeChange = (value: string | null): void => {
    setCheckType(value)
  }

  // 搜索功能
  const handleSearch = async (value: string): Promise<void> => {
    setSearchText(value)
    if (value.trim()) {
      setLoading(true)
      try {
        const result = await window.api.searchHealthChecks(value)
        if (result.success) {
          setHealthChecks(result.data || [])
        } else {
          message.error('搜索失败: ' + result.error)
        }
      } catch (error) {
        message.error('搜索失败: ' + (error as Error).message)
      } finally {
        setLoading(false)
      }
    } else {
      loadHealthChecks()
    }
  }

  // 过滤数据
  const getFilteredData = (): HealthCheck[] => {
    let filtered: HealthCheck[] = [...healthChecks]

    // 过滤基于搜索文本
    if (searchText) {
      filtered = filtered.filter(
        (record) =>
          record.petName?.includes(searchText) ||
          record.ownerName?.includes(searchText) ||
          record.diagnosis.includes(searchText)
      )
    }

    // 过滤基于日期范围
    if (dateRange) {
      const [start, end] = dateRange
      filtered = filtered.filter((record) => {
        const recordDate = dayjs(record.checkDate)
        return recordDate.isAfter(start.startOf('day')) && recordDate.isBefore(end.endOf('day'))
      })
    }

    // 过滤基于检查类型
    if (checkType) {
      filtered = filtered.filter((record) => record.checkType === checkType)
    }

    // 过滤基于标签页
    if (activeTab !== 'all') {
      filtered = filtered.filter((record) => record.status === activeTab)
    }

    return filtered
  }

  // 查看AI报告
  const handleViewReport = (record: HealthCheck): void => {
    const report = generateAiReport(record)
    setSelectedReport(report)
    setViewMode('report')
  }

  // 返回列表
  const handleBackToList = (): void => {
    setViewMode('list')
    setSelectedReport(null)
  }

  // 表格列定义
  const columns: TableProps<HealthCheck>['columns'] = [
    {
      title: '宠物名称',
      dataIndex: 'petName',
      key: 'petName',
      sorter: (a, b) => (a.petName || '').localeCompare(b.petName || '')
    },
    {
      title: '宠物类型',
      dataIndex: 'petType',
      key: 'petType',
      render: (type: string) => type || '-'
    },
    {
      title: '主人',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (ownerName: string) => ownerName || '-'
    },
    {
      title: '检查类型',
      dataIndex: 'checkType',
      key: 'checkType',
      render: (type: string) => checkTypeMap[type as keyof typeof checkTypeMap] || type,
      filters: Object.entries(checkTypeMap).map(([value, text]) => ({ text, value })),
      onFilter: (value: React.Key | boolean, record: HealthCheck) => record.checkType === value
    },
    {
      title: '检查日期',
      dataIndex: 'checkDate',
      key: 'checkDate',
      render: (date: Date) => date.toLocaleDateString('zh-CN'),
      sorter: (a, b) => new Date(a.checkDate).getTime() - new Date(b.checkDate).getTime()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status as keyof typeof statusColorMap]}>
          {statusMap[status as keyof typeof statusMap]}
        </Tag>
      ),
      filters: Object.entries(statusMap).map(([value, text]) => ({ text, value })),
      onFilter: (value: React.Key | boolean, record: HealthCheck) => record.status === value
    },
    {
      title: '诊断结果',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      render: (diagnosis: string) =>
        diagnosis ? (diagnosis.length > 30 ? diagnosis.substring(0, 30) + '...' : diagnosis) : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: HealthCheck) => (
        <Space size="middle">
          <Button type="text" icon={<FileTextOutlined />} onClick={() => handleViewReport(record)}>
            查看报告
          </Button>
        </Space>
      )
    }
  ]

  // 统计数据
  const totalChecks = healthChecks.length
  const completedChecks = healthChecks.filter((record) => record.status === 'completed').length
  const scheduledChecks = healthChecks.filter((record) => record.status === 'scheduled').length
  const inProgressChecks = healthChecks.filter((record) => record.status === 'in_progress').length

  // 标签页项
  const tabItems: TabsProps['items'] = [
    {
      key: 'all',
      label: `全部 (${totalChecks})`
    },
    {
      key: 'completed',
      label: `已完成 (${completedChecks})`
    },
    {
      key: 'scheduled',
      label: `已预约 (${scheduledChecks})`
    },
    {
      key: 'in_progress',
      label: `进行中 (${inProgressChecks})`
    }
  ]

  // 处理标签页变化
  const handleTabChange = (key: string): void => {
    setActiveTab(key as 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled')
  }

  // 刷新数据
  const handleRefresh = (): void => {
    loadHealthChecks()
  }

  // AI报告详情视图
  if (viewMode === 'report' && selectedReport) {
    return (
      <div className="page-container">
        <Button icon={<LeftOutlined />} onClick={handleBackToList} style={{ marginBottom: 16 }}>
          返回列表
        </Button>

        <Row gutter={24}>
          <Col xs={24} lg={8}>
            <Card title="相关报告列表" bordered={false} style={{ marginBottom: 24 }}>
              <List
                itemLayout="horizontal"
                dataSource={getFilteredData().slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key="view" type="link" onClick={() => handleViewReport(item)}>
                        查看
                      </Button>
                    ]}
                    className={item.id === selectedReport.id ? 'active-report' : ''}
                  >
                    <List.Item.Meta
                      title={<Text strong>{item.petName}</Text>}
                      description={
                        <>
                          <div>
                            {item.petType} | {dayjs(item.checkDate).format('YYYY-MM-DD')}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Tag
                              color={
                                item.status === 'completed'
                                  ? 'green'
                                  : item.status === 'in_progress'
                                    ? 'orange'
                                    : 'blue'
                              }
                            >
                              {statusMap[item.status as keyof typeof statusMap]}
                            </Tag>
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card bordered={false}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}
              >
                <Title level={3} style={{ margin: 0 }}>
                  {selectedReport.petName} 的健康报告
                </Title>
                <Tag
                  color={
                    selectedReport.status === '健康'
                      ? 'green'
                      : selectedReport.status === '需要注意'
                        ? 'orange'
                        : 'red'
                  }
                  style={{ fontSize: 16, padding: '4px 8px' }}
                >
                  {selectedReport.status}
                </Tag>
              </div>

              <Paragraph>
                <Text type="secondary">检测日期：{selectedReport.date}</Text>
              </Paragraph>

              <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="总体评估" key="1">
                  <Card title="健康亮点" bordered={false} style={{ marginBottom: 16 }}>
                    <List
                      dataSource={selectedReport.highlights}
                      renderItem={(item: string, index: number) => (
                        <List.Item key={index}>
                          <Text>✅ {item}</Text>
                        </List.Item>
                      )}
                    />
                  </Card>

                  {selectedReport.concerns.length > 0 && (
                    <Card title="需要关注" bordered={false}>
                      <List
                        dataSource={selectedReport.concerns}
                        renderItem={(item: string, index: number) => (
                          <List.Item key={index}>
                            <Text>⚠️ {item}</Text>
                          </List.Item>
                        )}
                      />
                    </Card>
                  )}

                  {selectedReport.concerns.length === 0 && (
                    <Card title="需要关注" bordered={false}>
                      <Text type="secondary">未检测到需要关注的健康问题</Text>
                    </Card>
                  )}
                </Tabs.TabPane>

                <Tabs.TabPane tab="详细分析" key="2">
                  <Paragraph>{selectedReport.detailedAnalysis}</Paragraph>
                  <Paragraph>
                    活动能力正常，未检测到关节问题。体型比例适中，未见明显肥胖或消瘦迹象。
                  </Paragraph>
                </Tabs.TabPane>

                <Tabs.TabPane tab="建议" key="3">
                  <Card bordered={false}>
                    <Paragraph>
                      <ul>
                        {selectedReport.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </Paragraph>
                  </Card>
                </Tabs.TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }

  // 报告列表视图
  return (
    <div className="page-container">
      <Title level={2}>健康报告中心</Title>
      <Paragraph>查看宠物健康检测记录和AI分析报告，跟踪宠物健康状况变化。</Paragraph>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', marginBottom: 16, gap: 16 }}>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>{totalChecks}</Title>
            <div>总检查记录</div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ color: 'green' }}>
              {completedChecks}
            </Title>
            <div>已完成</div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ color: 'orange' }}>
              {scheduledChecks}
            </Title>
            <div>已预约</div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ color: 'blue' }}>
              {inProgressChecks}
            </Title>
            <div>进行中</div>
          </div>
        </Card>
      </div>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />

        {/* 过滤器 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索宠物名称或主人"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
          />

          <RangePicker
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            placeholder={['开始日期', '结束日期']}
          />

          <Select
            placeholder="检查类型"
            allowClear
            style={{ width: 150 }}
            value={checkType}
            onChange={handleCheckTypeChange}
          >
            {Object.entries(checkTypeMap).map(([value, label]) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>

          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
        </div>

        {/* 检查历史表格 */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={getFilteredData()}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: loading ? '加载中...' : '暂无检查记录'
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default HealthReportCenter
