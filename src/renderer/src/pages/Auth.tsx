import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text } = Typography

interface LoginFormData {
  username: string
  password: string
}

interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleLogin = async (values: LoginFormData): Promise<void> => {
    setLoading(true)
    try {
      const success = await login(values.username, values.password)

      if (success) {
        message.success('登录成功')
      } else {
        message.error('用户名或密码错误')
      }
    } catch (error) {
      console.error('Login error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: RegisterFormData): Promise<void> => {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = values
      const success = await register(registerData)

      if (success) {
        message.success('注册成功，请登录')
        setIsLogin(true)
      } else {
        message.error('注册失败，请检查信息')
      }
    } catch (error) {
      console.error('Register error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            PetLink宠物健康管理
          </Title>
          <Text type="secondary">{isLogin ? '登录您的账户' : '创建新账户'}</Text>
        </div>

        {isLogin ? (
          <Form name="login" onFinish={handleLogin} autoComplete="off" size="large">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名!' }]}>
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: '请输入密码!' }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  width: '100%',
                  height: '45px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form name="register" onFinish={handleRegister} autoComplete="off" size="large">
            <Form.Item name="name" rules={[{ required: true, message: '请输入真实姓名!' }]}>
              <Input
                prefix={<UserOutlined />}
                placeholder="真实姓名"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名!' }]}>
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱!' },
                { type: 'email', message: '请输入有效的邮箱地址!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱" style={{ borderRadius: '8px' }} />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号!' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="手机号"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6位!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'))
                  }
                })
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  width: '100%',
                  height: '45px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                注册
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider style={{ margin: '20px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text>
            {isLogin ? '还没有账户？' : '已有账户？'}
            <Button
              type="link"
              onClick={() => setIsLogin(!isLogin)}
              style={{ padding: '0 4px', fontWeight: 'bold' }}
            >
              {isLogin ? '立即注册' : '立即登录'}
            </Button>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default AuthPage
