import React, { useState, useEffect } from 'react'
import { Typography, Card, Row, Col, Statistic, Progress, List, Spin, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface PetTypeDistribution {
  type: string
  count: number
}

interface CheckTypeDistribution {
  check_type: string
  count: number
}

interface Stats {
  totalClients: number
  totalPets: number
  totalHealthChecks: number
  healthChecksThisMonth: number
  newClientsThisMonth: number
  petTypeDistribution: PetTypeDistribution[]
  checkTypeDistribution: CheckTypeDistribution[]
}

interface HealthCheck {
  id: string
  petId: string
  checkDate: Date
  checkType: string
  veterinarian: string
  diagnosis: string
  petName?: string
  ownerName?: string
  pet_name?: string
  owner_name?: string
  pet_type?: string
  check_date?: Date
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentHealthChecks, setRecentHealthChecks] = useState<HealthCheck[]>([])
  const [loading, setLoading] = useState(false)

  // 加载统计数据
  const loadStats = async (): Promise<void> => {
    setLoading(true)
    try {
      console.log('开始加载统计数据...')
      console.log('检查API可用性:', {
        windowApi: !!window.api,
        getStatsMethod: !!window.api?.getStats,
        apiType: typeof window.api,
        getStatsType: typeof window.api?.getStats
      })

      if (!window.api) {
        console.error('window.api 未定义')
        message.error('API未就绪，请稍后重试')
        setStats(null)
        return
      }

      if (!window.api.getStats) {
        console.error('getStats方法未定义')
        message.error('统计API未就绪，请稍后重试')
        setStats(null)
        return
      }

      const result = await window.api.getStats()
      console.log('统计数据API返回结果：', result)

      if (result.success) {
        if (result.data) {
          console.log('统计数据详情：', {
            totalPets: result.data.totalPets,
            totalClients: result.data.totalClients,
            petTypeDistribution: result.data.petTypeDistribution,
            checkTypeDistribution: result.data.checkTypeDistribution
          })
          setStats(result.data)
        } else {
          console.error('统计数据为空')
          setStats(null)
        }
      } else {
        console.error('获取统计数据失败:', result.error)
        setStats(null)
      }
    } catch (error) {
      console.error('加载统计数据异常:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  // 加载最近健康检查
  const loadRecentHealthChecks = async (): Promise<void> => {
    try {
      const result = await window.api.getHealthChecks()
      if (result.success) {
        const checks = result.data || []
        // 取最近5条记录
        setRecentHealthChecks(checks.slice(0, 5))
      }
    } catch (error) {
      console.error('加载健康检查数据失败:', error)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadStats()
    loadRecentHealthChecks()
  }, [])

  // 刷新数据
  const handleRefresh = (): void => {
    loadStats()
    loadRecentHealthChecks()
  }
  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}
      >
        <div>
          <Title level={2}>数据仪表盘</Title>
          <Paragraph>一目了然查看诊所运营数据，监控关键指标，优化业务决策。</Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
          刷新数据
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="宠物总数"
                value={stats?.totalPets || 0}
                valueStyle={{ color: '#3f8600' }}
                prefix="🐾"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="客户总数"
                value={stats?.totalClients || 0}
                valueStyle={{ color: '#3f8600' }}
                prefix="👥"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="本月检测"
                value={stats?.healthChecksThisMonth || 0}
                valueStyle={{ color: '#1890ff' }}
                prefix="❤️"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="总检查数"
                value={stats?.totalHealthChecks || 0}
                valueStyle={{ color: '#722ed1' }}
                prefix="📋"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="宠物类型分布" bordered={false}>
              <Row gutter={16}>
                {stats?.petTypeDistribution &&
                Array.isArray(stats.petTypeDistribution) &&
                stats.petTypeDistribution.length > 0 ? (
                  stats.petTypeDistribution.map((item: PetTypeDistribution, index: number) => {
                    const total = stats.petTypeDistribution.reduce(
                      (sum: number, pet: PetTypeDistribution) => sum + pet.count,
                      0
                    )
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                    const colors = ['#1890ff', '#13c2c2', '#722ed1', '#fa8c16', '#52c41a']

                    // 宠物类型映射
                    const typeLabels: { [key: string]: string } = {
                      dog: '狗',
                      cat: '猫',
                      horse: '马',
                      other: '其他'
                    }

                    return (
                      <Col span={8} key={index}>
                        <Progress
                          type="circle"
                          percent={percentage}
                          format={() => typeLabels[item.type] || item.type}
                          width={80}
                          strokeColor={colors[index] || '#1890ff'}
                        />
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                          {percentage}% ({item.count}只)
                        </div>
                      </Col>
                    )
                  })
                ) : (
                  <Col span={24}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>暂无宠物数据</div>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="本月检查类型分布" bordered={false}>
              <div style={{ padding: '0 20px' }}>
                {stats?.checkTypeDistribution?.map((item: CheckTypeDistribution, index: number) => {
                  const total = stats.checkTypeDistribution.reduce(
                    (sum: number, check: CheckTypeDistribution) => sum + check.count,
                    0
                  )
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                  const colors = ['#52c41a', '#faad14', '#f5222d', '#1890ff', '#722ed1']

                  // 检查类型映射
                  const checkTypeLabels: { [key: string]: string } = {
                    routine: '常规体检',
                    vaccination: '疫苗接种',
                    skin: '皮肤检查',
                    specialized: '专项检查',
                    emergency: '急诊'
                  }

                  return (
                    <Progress
                      key={index}
                      percent={percentage}
                      strokeColor={colors[index] || '#1890ff'}
                      format={() => checkTypeLabels[item.check_type] || item.check_type}
                      style={{ marginBottom: 12 }}
                    />
                  )
                })}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title="最近健康检查" bordered={false}>
              <List
                dataSource={recentHealthChecks}
                renderItem={(item) => (
                  <List.Item actions={[<a key="list-loadmore-edit">查看详情</a>]}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: '#1890ff',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          🏥
                        </div>
                      }
                      title={<a href="javascript:;">{item.pet_name}</a>}
                      description={`${item.pet_type} | 主人: ${item.owner_name} | 检查日期: ${item.check_date ? new Date(item.check_date).toLocaleDateString('zh-CN') : '未知'}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard
