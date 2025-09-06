import { create } from 'zustand'
import { Client, PaginationParams, SearchFilters } from '../types/index'

export interface ClientState {
  // 状态
  clients: Client[]
  currentClient: Client | null
  loading: boolean
  error: string | null
  pagination: PaginationParams

  // 操作方法
  // 获取客户列表
  fetchClients: (filters?: SearchFilters) => Promise<void>

  // 获取单个客户
  fetchClientById: (id: string) => Promise<void>

  // 创建客户
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>

  // 更新客户
  updateClient: (id: string, client: Partial<Client>) => Promise<void>

  // 删除客户
  deleteClient: (id: string) => Promise<void>

  // 设置当前客户
  setCurrentClient: (client: Client | null) => void

  // 清除错误
  clearError: () => void

  // 设置分页
  setPagination: (pagination: Partial<PaginationParams>) => void
}

export const useClientStore = create<ClientState>((set, get) => ({
  // 初始状态
  clients: [],
  currentClient: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  },

  // 获取客户列表
  fetchClients: async () => {
    set({ loading: true, error: null })

    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 模拟数据
      const mockClients: Client[] = [
        {
          id: '1',
          name: '张三',
          phone: '13800138000',
          wechat: 'zhangsan_wechat',
          address: '北京市朝阳区xxx街道',
          notes: '老客户，养狗经验丰富',
          createdAt: new Date('2023-01-10'),
          updatedAt: new Date('2023-11-20')
        },
        {
          id: '2',
          name: '李四',
          phone: '13900139000',
          wechat: 'lisi_wechat',
          address: '上海市浦东新区xxx路',
          notes: '新客户，养猫新手',
          createdAt: new Date('2023-06-15'),
          updatedAt: new Date('2023-12-01')
        }
      ]

      set({
        clients: mockClients,
        loading: false,
        pagination: {
          ...get().pagination,
          total: mockClients.length
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取客户列表失败',
        loading: false
      })
    }
  },

  // 获取单个客户
  fetchClientById: async (id: string) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const client = get().clients.find((c) => c.id === id)
      if (client) {
        set({ currentClient: client, loading: false })
      } else {
        set({
          error: '客户不存在',
          loading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取客户信息失败',
        loading: false
      })
    }
  },

  // 创建客户
  createClient: async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      set((state) => ({
        clients: [...state.clients, newClient],
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建客户失败',
        loading: false
      })
    }
  },

  // 更新客户
  updateClient: async (id: string, clientData: Partial<Client>) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? { ...client, ...clientData, updatedAt: new Date() } : client
        ),
        currentClient:
          state.currentClient?.id === id
            ? { ...state.currentClient, ...clientData, updatedAt: new Date() }
            : state.currentClient,
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新客户信息失败',
        loading: false
      })
    }
  },

  // 删除客户
  deleteClient: async (id: string) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        currentClient: state.currentClient?.id === id ? null : state.currentClient,
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除客户失败',
        loading: false
      })
    }
  },

  // 设置当前客户
  setCurrentClient: (client: Client | null) => {
    set({ currentClient: client })
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },

  // 设置分页
  setPagination: (pagination: Partial<PaginationParams>) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination }
    }))
  }
}))
