import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Table,
  Button,
  DatePicker,
  Input,
  Space,
  message,
  Spin
} from 'antd'
import { FileTextOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'

const { Title, Paragraph } = Typography
const { RangePicker } = DatePicker

// AI健康报告记录接口
interface AIReportRecord {
  id: string
  petName: string
  petType: string
  petBreed: string
  ownerName: string
  ownerPhone: string
  reportGeneratedAt: Date
  documentName: string
  reportStatus: 'completed'
  createdAt: Date
}

const CheckHistory: React.FC = () => {
  const [aiReports, setAiReports] = useState<AIReportRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  // 加载AI报告历史数据
  const loadAIReports = async (): Promise<void> => {
    setLoading(true)
    try {
      // 模拟AI报告历史数据
      const mockReports: AIReportRecord[] = [
        {
          id: '1',
          petName: '小白',
          petType: '狗',
          petBreed: '金毛',
          ownerName: '张三',
          ownerPhone: '13800138001',
          reportGeneratedAt: new Date('2024-01-15 14:30:00'),
          documentName: '小白_健康检查报告.docx',
          reportStatus: 'completed',
          createdAt: new Date('2024-01-15 14:30:00')
        },
        {
          id: '2',
          petName: '咪咪',
          petType: '猫',
          petBreed: '英短',
          ownerName: '李四',
          ownerPhone: '13800138002',
          reportGeneratedAt: new Date('2024-01-14 10:15:00'),
          documentName: '咪咪_健康分析报告.docx',
          reportStatus: 'completed',
          createdAt: new Date('2024-01-14 10:15:00')
        },
        {
          id: '3',
          petName: '大黄',
          petType: '狗',
          petBreed: '拉布拉多',
          ownerName: '王五',
          ownerPhone: '13800138003',
          reportGeneratedAt: new Date('2024-01-13 16:45:00'),
          documentName: '大黄_AI健康报告.docx',
          reportStatus: 'completed',
          createdAt: new Date('2024-01-13 16:45:00')
        },
        {
          id: '4',
          petName: '小花',
          petType: '猫',
          petBreed: '波斯猫',
          ownerName: '赵六',
          ownerPhone: '13800138004',
          reportGeneratedAt: new Date('2024-01-12 09:20:00'),
          documentName: '小花_健康评估报告.docx',
          reportStatus: 'completed',
          createdAt: new Date('2024-01-12 09:20:00')
        },
        {
          id: '5',
          petName: '旺财',
          petType: '狗',
          petBreed: '柴犬',
          ownerName: '孙七',
          ownerPhone: '13800138005',
          reportGeneratedAt: new Date('2024-01-11 15:10:00'),
          documentName: '旺财_AI分析报告.docx',
          reportStatus: 'completed',
          createdAt: new Date('2024-01-11 15:10:00')
        }
      ]
      
      // 按时间倒序排列
      const sortedReports = mockReports.sort((a, b) => 
        new Date(b.reportGeneratedAt).getTime() - new Date(a.reportGeneratedAt).getTime()
      )
      
      setAiReports(sortedReports)
    } catch (error) {
      message.error('加载AI报告历史失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadAIReports()
  }, [])

  // 处理日期范围变化
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null): void => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    } else {
      setDateRange(null)
    }
  }

  // 搜索功能
  const handleSearch = (value: string): void => {
    setSearchText(value)
  }

  // 过滤数据
  const getFilteredData = (): AIReportRecord[] => {
    let filtered: AIReportRecord[] = [...aiReports]

    // 过滤基于搜索文本
    if (searchText) {
      filtered = filtered.filter(
        (record) =>
          record.petName.includes(searchText) ||
          record.ownerName.includes(searchText) ||
          record.petBreed.includes(searchText)
      )
    }

    // 过滤基于日期范围
    if (dateRange) {
      const [start, end] = dateRange
      filtered = filtered.filter((record) => {
        const recordDate = dayjs(record.reportGeneratedAt)
        return recordDate.isAfter(start.startOf('day')) && recordDate.isBefore(end.endOf('day'))
      })
    }

    return filtered
  }

  // 表格列定义
  const columns: TableProps<AIReportRecord>['columns'] = [
    {
      title: '宠物名称',
      dataIndex: 'petName',
      key: 'petName',
      sorter: (a, b) => a.petName.localeCompare(b.petName),
      width: 120
    },
    {
      title: '宠物类型',
      dataIndex: 'petType',
      key: 'petType',
      width: 100
    },
    {
      title: '品种',
      dataIndex: 'petBreed',
      key: 'petBreed',
      width: 120
    },
    {
      title: '主人',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 100
    },
    {
      title: '联系电话',
      dataIndex: 'ownerPhone',
      key: 'ownerPhone',
      width: 130
    },
    {
      title: '检测时间',
      dataIndex: 'reportGeneratedAt',
      key: 'reportGeneratedAt',
      render: (date: Date) => {
        return dayjs(date).format('YYYY-MM-DD HH:mm')
      },
      sorter: (a, b) => {
        return new Date(b.reportGeneratedAt).getTime() - new Date(a.reportGeneratedAt).getTime()
      },
      defaultSortOrder: 'ascend',
      width: 150
    },
    {
      title: '文档名称',
      dataIndex: 'documentName',
      key: 'documentName',
      render: (name: string) => (
        <span style={{ color: '#1890ff' }}>{name}</span>
      ),
      width: 200
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AIReportRecord) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => console.log('View report for', record.id)}
            size="small"
          >
            查看报告
          </Button>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => console.log('Download report for', record.id)}
            size="small"
          >
            下载PDF
          </Button>
        </Space>
      ),
      width: 150
    }
  ]

  // 统计数据
  const totalReports = aiReports.length
  const todayReports = aiReports.filter(record => 
    dayjs(record.reportGeneratedAt).isSame(dayjs(), 'day')
  ).length
  const thisWeekReports = aiReports.filter(record => 
    dayjs(record.reportGeneratedAt).isSame(dayjs(), 'week')
  ).length
  const thisMonthReports = aiReports.filter(record => 
    dayjs(record.reportGeneratedAt).isSame(dayjs(), 'month')
  ).length

  // 刷新数据
  const handleRefresh = (): void => {
    loadAIReports()
  }

  return (
    <div className="page-container">
      <Title level={2}>AI健康报告历史</Title>
      <Paragraph>查看宠物AI健康报告生成历史记录，包含详细的检测信息和时间。</Paragraph>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', marginBottom: 16, gap: 16 }}>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>{totalReports}</Title>
            <div>总报告数</div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>{todayReports}</Title>
            <div>今日生成</div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>{thisWeekReports}</Title>
            <div>本周生成</div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>{thisMonthReports}</Title>
            <div>本月生成</div>
          </div>
        </Card>
      </div>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        {/* 过滤器 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索宠物名称、主人或品种"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
          />

          <RangePicker 
            onChange={handleDateRangeChange} 
            placeholder={['开始日期', '结束日期']} 
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
          />

          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
        </div>

        {/* AI报告历史表格 */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={getFilteredData()}
            rowKey="id"
            pagination={{
              total: getFilteredData().length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: loading ? '加载中...' : '暂无AI报告记录'
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default CheckHistory
