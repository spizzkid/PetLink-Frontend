import { create } from 'zustand'
import { HealthCheck, PaginationParams, SearchFilters } from '../types/index'

export interface HealthCheckState {
  // 状态
  healthChecks: HealthCheck[]
  currentHealthCheck: HealthCheck | null
  loading: boolean
  error: string | null
  pagination: PaginationParams

  // 操作方法
  // 获取健康检查列表
  fetchHealthChecks: (filters?: SearchFilters) => Promise<void>

  // 获取单个健康检查记录
  fetchHealthCheckById: (id: string) => Promise<void>

  // 创建健康检查记录
  createHealthCheck: (check: Omit<HealthCheck, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>

  // 更新健康检查记录
  updateHealthCheck: (id: string, check: Partial<HealthCheck>) => Promise<void>

  // 删除健康检查记录
  deleteHealthCheck: (id: string) => Promise<void>

  // 设置当前健康检查记录
  setCurrentHealthCheck: (check: HealthCheck | null) => void

  // 清除错误
  clearError: () => void

  // 设置分页
  setPagination: (pagination: Partial<PaginationParams>) => void

  // 根据宠物ID获取检查记录
  fetchHealthChecksByPetId: (petId: string) => Promise<void>
}

export const useHealthCheckStore = create<HealthCheckState>((set, get) => ({
  // 初始状态
  healthChecks: [],
  currentHealthCheck: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  },

  // 获取健康检查列表
  fetchHealthChecks: async () => {
    set({ loading: true, error: null })

    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 模拟数据
      const mockHealthChecks: HealthCheck[] = [
        {
          id: '1',
          petId: '1',
          checkDate: new Date('2023-12-01'),
          checkType: 'routine',
          veterinarian: '王医生',
          weight: 25.5,
          temperature: 38.5,
          heartRate: 85,
          symptoms: ['食欲不振', '精神萎靡'],
          diagnosis: '轻微感冒',
          treatment: '开药治疗，建议休息',
          prescriptions: [
            {
              id: '1',
              medication: '感冒灵',
              dosage: '每次2片',
              frequency: '每日3次',
              duration: '7天',
              instructions: '饭后服用'
            }
          ],
          notes: '主人反映宠物最近不太爱动',
          followUpDate: new Date('2023-12-08'),
          status: 'completed',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-01')
        },
        {
          id: '2',
          petId: '2',
          checkDate: new Date('2023-11-15'),
          checkType: 'vaccination',
          veterinarian: '李医生',
          weight: 4.2,
          temperature: 38.2,
          heartRate: 120,
          symptoms: [],
          diagnosis: '健康状态良好',
          treatment: '接种疫苗',
          prescriptions: [],
          notes: '年度疫苗接种',
          followUpDate: new Date('2024-11-15'),
          status: 'completed',
          createdAt: new Date('2023-11-15'),
          updatedAt: new Date('2023-11-15')
        }
      ]

      set({
        healthChecks: mockHealthChecks,
        loading: false,
        pagination: {
          ...get().pagination,
          total: mockHealthChecks.length
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取健康检查记录失败',
        loading: false
      })
    }
  },

  // 获取单个健康检查记录
  fetchHealthCheckById: async (id: string) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const check = get().healthChecks.find((h) => h.id === id)
      if (check) {
        set({ currentHealthCheck: check, loading: false })
      } else {
        set({
          error: '健康检查记录不存在',
          loading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取健康检查记录失败',
        loading: false
      })
    }
  },

  // 创建健康检查记录
  createHealthCheck: async (checkData: Omit<HealthCheck, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const newHealthCheck: HealthCheck = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      set((state) => ({
        healthChecks: [...state.healthChecks, newHealthCheck],
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建健康检查记录失败',
        loading: false
      })
    }
  },

  // 更新健康检查记录
  updateHealthCheck: async (id: string, checkData: Partial<HealthCheck>) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      set((state) => ({
        healthChecks: state.healthChecks.map((check) =>
          check.id === id ? { ...check, ...checkData, updatedAt: new Date() } : check
        ),
        currentHealthCheck:
          state.currentHealthCheck?.id === id
            ? { ...state.currentHealthCheck, ...checkData, updatedAt: new Date() }
            : state.currentHealthCheck,
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新健康检查记录失败',
        loading: false
      })
    }
  },

  // 删除健康检查记录
  deleteHealthCheck: async (id: string) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      set((state) => ({
        healthChecks: state.healthChecks.filter((check) => check.id !== id),
        currentHealthCheck: state.currentHealthCheck?.id === id ? null : state.currentHealthCheck,
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除健康检查记录失败',
        loading: false
      })
    }
  },

  // 设置当前健康检查记录
  setCurrentHealthCheck: (check: HealthCheck | null) => {
    set({ currentHealthCheck: check })
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
  },

  // 根据宠物ID获取检查记录
  fetchHealthChecksByPetId: async (petId: string) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const petChecks = get().healthChecks.filter((check) => check.petId === petId)

      set({
        healthChecks: petChecks,
        loading: false,
        pagination: {
          ...get().pagination,
          total: petChecks.length
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取宠物检查记录失败',
        loading: false
      })
    }
  }
}))
