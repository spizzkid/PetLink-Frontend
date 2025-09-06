import React from 'react'
import { Typography, Card, Row, Col, Statistic } from 'antd'

const { Title, Paragraph } = Typography

const Home: React.FC = () => {
  return (
    <div className="page-container">
      <Title level={2}>欢迎使用 PetLink 宠联联</Title>
      <Paragraph>
        AI宠物健康管理系统为您提供全面的宠物健康管理服务。通过我们的系统，您可以轻松管理客户信息、宠物档案、健康检测记录，并获得基于AI的健康报告分析。
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="宠物总数" value={127} prefix="🐾" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="客户总数" value={86} prefix="👥" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="今日检测" value={12} prefix="❤️" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="待处理报告" value={5} prefix="📋" />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 32 }}>
        <Title level={3}>快速操作</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card title="健康检测" bordered={false} hoverable style={{ cursor: 'pointer' }}>
              开始新的宠物健康检测流程
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card title="管理客户" bordered={false} hoverable style={{ cursor: 'pointer' }}>
              查看和管理您的客户信息
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card title="宠物档案" bordered={false} hoverable style={{ cursor: 'pointer' }}>
              检索并更新宠物健康记录
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default Home
