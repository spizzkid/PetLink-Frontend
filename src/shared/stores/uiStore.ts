import { create } from 'zustand'
import { UIState, Notification } from '../types/index'

export interface UIStore extends UIState {
  // 操作方法
  // 切换侧边栏
  toggleSidebar: () => void

  // 设置侧边栏状态
  setSidebarCollapsed: (collapsed: boolean) => void

  // 设置活动菜单
  setActiveMenu: (menu: string) => void

  // 切换主题
  toggleTheme: () => void

  // 设置主题
  setTheme: (theme: 'dark' | 'light') => void

  // 添加通知
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void

  // 移除通知
  removeNotification: (id: string) => void

  // 清除所有通知
  clearNotifications: () => void

  // 显示成功消息
  showSuccess: (title: string, message: string, duration?: number) => void

  // 显示错误消息
  showError: (title: string, message: string, duration?: number) => void

  // 显示警告消息
  showWarning: (title: string, message: string, duration?: number) => void

  // 显示信息消息
  showInfo: (title: string, message: string, duration?: number) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  // 初始状态
  sidebarCollapsed: false,
  activeMenu: 'home',
  theme: 'dark',
  notifications: [],

  // 切换侧边栏
  toggleSidebar: () => {
    set((state: UIStore) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  // 设置侧边栏状态
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed })
  },

  // 设置活动菜单
  setActiveMenu: (menu: string) => {
    set({ activeMenu: menu })
  },

  // 切换主题
  toggleTheme: () => {
    set((state: UIStore) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark'
    }))
  },

  // 设置主题
  setTheme: (theme: 'dark' | 'light') => {
    set({ theme })
  },

  // 添加通知
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date()
    }

    set((state: UIStore) => ({
      notifications: [...state.notifications, newNotification]
    }))

    // 自动移除通知
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(newNotification.id)
      }, notification.duration || 5000)
    }
  },

  // 移除通知
  removeNotification: (id: string) => {
    set((state: UIStore) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }))
  },

  // 清除所有通知
  clearNotifications: () => {
    set({ notifications: [] })
  },

  // 显示成功消息
  showSuccess: (title: string, message: string, duration = 3000) => {
    get().addNotification({
      type: 'success',
      title,
      message,
      duration
    })
  },

  // 显示错误消息
  showError: (title: string, message: string, duration = 5000) => {
    get().addNotification({
      type: 'error',
      title,
      message,
      duration
    })
  },

  // 显示警告消息
  showWarning: (title: string, message: string, duration = 4000) => {
    get().addNotification({
      type: 'warning',
      title,
      message,
      duration
    })
  },

  // 显示信息消息
  showInfo: (title: string, message: string, duration = 3000) => {
    get().addNotification({
      type: 'info',
      title,
      message,
      duration
    })
  }
}))
