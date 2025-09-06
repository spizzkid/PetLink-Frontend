// 导出所有 store
export { usePetStore } from './petStore'
export { useClientStore } from './clientStore'
export { useHealthCheckStore } from './healthCheckStore'
export { useUIStore } from './uiStore'

// 导出别名（保持向后兼容）
export { usePetStore as petStore } from './petStore'
export { useClientStore as clientStore } from './clientStore'
export { useHealthCheckStore as healthCheckStore } from './healthCheckStore'
export { useUIStore as uiStore } from './uiStore'

// 导出类型
export type { PetState } from './petStore'
export type { ClientState } from './clientStore'
export type { HealthCheckState } from './healthCheckStore'
export type { UIStore } from './uiStore'
