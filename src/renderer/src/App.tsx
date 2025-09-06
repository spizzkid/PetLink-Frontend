import React, { useState } from 'react'
import { ConfigProvider, theme, Layout } from 'antd'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import './assets/base.css'
import './assets/main.css'

// 导入所有页面组件
import Home from './pages/Home'
import HealthCheck from './pages/HealthCheck'
import AiReport from './pages/AiReport'
import Dashboard from './pages/Dashboard'
import ClientManagement from './pages/ClientManagement'
import PetManagement from './pages/PetManagement'
import CheckHistory from './pages/CheckHistory'
import Settings from './pages/Settings'
import About from './pages/About'
import Auth from './pages/Auth'
import AdminDashboard from './pages/AdminDashboard'

const { Content } = Layout

function AppContent(): React.JSX.Element {
  const [activeMenu, setActiveMenu] = useState<string>('pet-management')
  const { isAuthenticated, loading } = useAuth()

  // 处理菜单项点击
  const handleMenuClick = (key: string): void => {
    setActiveMenu(key)
  }

  // 根据当前活动菜单项渲染对应的组件
  const renderContent = (): React.ReactNode => {
    switch (activeMenu) {
      case 'health-check':
        return <HealthCheck />
      case 'ai-report':
        return <AiReport />
      case 'dashboard':
        return <Dashboard />
      case 'client-management':
        return <ClientManagement />
      case 'pet-management':
        return <PetManagement />
      case 'check-history':
        return <CheckHistory />
      case 'settings':
        return <Settings />
      case 'about':
        return <About />
      case 'admin-dashboard':
        return <AdminDashboard />
      case 'health-report-center':
        return <CheckHistory />
      case 'archive-management':
        return <ClientManagement />
      case 'data-statistics':
        return <Dashboard />
      case 'home':
      default:
        return <Home />
    }
  }

  // 显示加载状态
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <div>加载中...</div>
      </div>
    )
  }

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <Auth />
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorBgBase: '#1a1a1a',
          colorBgContainer: '#222222',
          colorBgElevated: '#282828',
          colorBorder: '#32363f',
          colorText: 'rgba(255, 255, 245, 0.86)',
          colorTextSecondary: 'rgba(235, 235, 245, 0.6)'
        }
      }}
    >
      <Layout className="app-layout">
        <Sidebar activeItem={activeMenu} onItemClick={handleMenuClick} />
        <Layout className="main-layout">
          <Content className="content-area">{renderContent()}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
