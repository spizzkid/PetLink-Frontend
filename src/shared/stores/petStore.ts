import { create } from 'zustand'
import { Pet, PaginationParams, SearchFilters } from '../types/index'

export interface PetState {
  // 状态
  pets: Pet[]
  currentPet: Pet | null
  loading: boolean
  error: string | null
  pagination: PaginationParams

  // 操作方法
  // 获取宠物列表
  fetchPets: (filters?: SearchFilters) => Promise<void>

  // 获取单个宠物
  fetchPetById: (id: string) => Promise<void>

  // 创建宠物
  createPet: (pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>

  // 更新宠物
  updatePet: (id: string, pet: Partial<Pet>) => Promise<void>

  // 删除宠物
  deletePet: (id: string) => Promise<void>

  // 设置当前宠物
  setCurrentPet: (pet: Pet | null) => void

  // 清除错误
  clearError: () => void

  // 设置分页
  setPagination: (pagination: Partial<PaginationParams>) => void
}

export const usePetStore = create<PetState>((set, get) => ({
  // 初始状态
  pets: [],
  currentPet: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  },

  // 获取宠物列表
  fetchPets: async () => {
    set({ loading: true, error: null })

    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 模拟数据
      const mockPets: Pet[] = [
        {
          id: '1',
          name: '小白',
          type: 'dog',
          breed: '金毛寻回犬',
          age: 3,
          weight: 25.5,
          gender: 'male',
          ownerId: '1',
          avatar: '',
          notes: '活泼可爱的金毛',
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-12-01')
        },
        {
          id: '2',
          name: '咪咪',
          type: 'cat',
          breed: '英短蓝猫',
          age: 2,
          weight: 4.2,
          gender: 'female',
          ownerId: '2',
          avatar: '',
          notes: '温顺的英短蓝猫',
          createdAt: new Date('2023-03-20'),
          updatedAt: new Date('2023-11-15')
        }
      ]

      set({
        pets: mockPets,
        loading: false,
        pagination: {
          ...get().pagination,
          total: mockPets.length
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取宠物列表失败',
        loading: false
      })
    }
  },

  // 获取单个宠物
  fetchPetById: async (id: string) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const pet = get().pets.find((p) => p.id === id)
      if (pet) {
        set({ currentPet: pet, loading: false })
      } else {
        set({
          error: '宠物不存在',
          loading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取宠物信息失败',
        loading: false
      })
    }
  },

  // 创建宠物
  createPet: async (petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const newPet: Pet = {
        ...petData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      set((state) => ({
        pets: [...state.pets, newPet],
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建宠物失败',
        loading: false
      })
    }
  },

  // 更新宠物
  updatePet: async (id: string, petData: Partial<Pet>) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      set((state) => ({
        pets: state.pets.map((pet) =>
          pet.id === id ? { ...pet, ...petData, updatedAt: new Date() } : pet
        ),
        currentPet:
          state.currentPet?.id === id
            ? { ...state.currentPet, ...petData, updatedAt: new Date() }
            : state.currentPet,
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新宠物信息失败',
        loading: false
      })
    }
  },

  // 删除宠物
  deletePet: async (id: string) => {
    set({ loading: true, error: null })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      set((state) => ({
        pets: state.pets.filter((pet) => pet.id !== id),
        currentPet: state.currentPet?.id === id ? null : state.currentPet,
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除宠物失败',
        loading: false
      })
    }
  },

  // 设置当前宠物
  setCurrentPet: (pet: Pet | null) => {
    set({ currentPet: pet })
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
