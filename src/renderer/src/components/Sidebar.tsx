import React from 'react'
import { Layout, Menu, Button, Divider } from 'antd'
import { useAuth } from '../contexts/AuthContext'

const { Sider } = Layout

interface SidebarProps {
  activeItem?: string
  onItemClick?: (key: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'pet-management', onItemClick }) => {
  const { isAdmin, user, logout } = useAuth()

  const handleMenuClick = ({ key }: { key: string }): void => {
    onItemClick?.(key)
  }

  const handleStartCheck = (): void => {
    onItemClick?.('health-check')
  }

  return (
    <Sider
      width={280}
      theme="dark"
      style={{
        height: '100vh',
        background: '#1f1f1f',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* 可滚动内容区域 */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Logo */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #333',
            textAlign: 'center'
          }}
        >
          <h1
            style={{
              color: '#00d4ff',
              fontSize: '24px',
              margin: 0,
              fontWeight: 'bold'
            }}
          >
            PetLink宠联联
          </h1>
        </div>

        {/* 开始健康检测按钮 */}
        <div style={{ padding: '16px' }}>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleStartCheck}
            style={{
              background: '#00d4ff',
              borderColor: '#00d4ff',
              height: '48px',
              fontSize: '16px'
            }}
          >
            🔍 开始健康检测
          </Button>
        </div>

        {/* 宠物管理 */}
        <div style={{ padding: '0 16px' }}>
          <Divider orientation="left" style={{ color: '#999', fontSize: '12px' }}>
            宠物管理
          </Divider>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeItem]}
          onClick={handleMenuClick}
          style={{ background: 'transparent', border: 'none' }}
          items={[
            {
              key: 'pet-management',
              icon: '🐕',
              label: '宠物档案'
            },
            {
              key: 'health-report-center',
              icon: '📊',
              label: '健康报告中心'
            },
            {
              key: 'archive-management',
              icon: '📁',
              label: '客户档案'
            },
            {
              key: 'data-statistics',
              icon: '📈',
              label: '数据统计'
            }
          ]}
        />

        {/* 辅助功能 */}
        <div style={{ padding: '0 16px', marginTop: '20px' }}>
          <Divider orientation="left" style={{ color: '#999', fontSize: '12px' }}>
            AI健康报告综合评估
          </Divider>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeItem]}
          onClick={handleMenuClick}
          style={{ background: 'transparent', border: 'none' }}
          items={[
            {
              key: 'health-check',
              icon: '❤️',
              label: '健康检测'
            }
          ]}
        />

        {/* 系统设置 */}
        <div style={{ padding: '0 16px', marginTop: '20px' }}>
          <Divider orientation="left" style={{ color: '#999', fontSize: '12px' }}>
            系统设置
          </Divider>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeItem]}
          onClick={handleMenuClick}
          style={{ background: 'transparent', border: 'none' }}
          items={[
            ...(isAdmin()
              ? [
                  {
                    key: 'admin-dashboard',
                    icon: '👨‍💼',
                    label: '管理员控制台'
                  }
                ]
              : []),
            {
              key: 'settings',
              icon: '⚙️',
              label: '系统设置'
            },
            {
              key: 'about',
              icon: 'ℹ️',
              label: '关于系统'
            }
          ]}
        />
      </div>

      {/* 用户信息 / 退出登录 - 固定底部 */}
      <div
        style={{
          marginTop: 'auto',
          padding: '12px 16px',
          borderTop: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#bbb'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>👤</span>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: '#fff' }}>{user?.username ?? '未登录'}</div>
            {/* 角色信息已隐藏 */}
          </div>
        </div>
        {user ? (
          <Button
            type="link"
            size="small"
            onClick={logout}
            style={{ padding: 0, color: '#ff7875' }}
          >
            退出
          </Button>
        ) : null}
      </div>
    </Sider>
  )
}

export default Sidebar
