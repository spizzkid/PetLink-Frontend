import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// 使用 preload 中定义的类型
interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'store'
  is_active: boolean
  created_at: string
}

interface RegisterData {
  username: string
  email: string
  password: string
  name: string
  phone: string
  role?: 'admin' | 'store'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: () => boolean
  isStore: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // 检查本地存储的用户信息
    const storedUser = localStorage.getItem('user')

    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (username: string, _password: string): Promise<boolean> => {
    try {
      // 原始登录逻辑 - 已注释
      // const response = await window.api.login(username, password)

      // 临时跳过认证 - 直接创建用户数据
      const userData: User = {
        id: '1',
        username,
        email: '',
        name: username,
        role: 'store',
        is_active: true,
        created_at: new Date().toISOString()
      }

      setUser(userData)
      setIsAuthenticated(true)

      // 保存到本地存储
      localStorage.setItem('user', JSON.stringify(userData))

      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const register = async (_userData: RegisterData): Promise<boolean> => {
    try {
      // 原始注册逻辑 - 已注释
      // await window.api.register(userData)

      // 临时跳过注册认证 - 直接返回成功
      console.log('Register bypassed - no authentication required')
      return true
    } catch (error) {
      console.error('Register error:', error)
      return false
    }
  }

  const logout = useCallback((): void => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
  }, [])

  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin'
  }, [user])

  const isStore = useCallback((): boolean => {
    return user?.role === 'store'
  }, [user])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    isStore
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
