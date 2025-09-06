import { message } from 'antd'

// 错误类型定义
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: unknown
  isRetryable?: boolean
}

// 错误分类
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  API = 'API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTH = 'AUTH_ERROR',
  DATABASE = 'DATABASE_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler

  private constructor() {
    // 私有构造函数防止外部实例化
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // 处理错误
  handleError(error: unknown, context?: string): void {
    const appError = this.normalizeError(error)
    const errorType = this.classifyError(appError)

    // 记录错误
    this.logError(appError, errorType, context)

    // 显示用户友好的错误信息
    this.showErrorToUser(appError, errorType)

    // 可以在这里添加错误报告逻辑
    // this.reportError(appError, errorType, context)
  }

  // 标准化错误
  private normalizeError(error: unknown): AppError {
    if (typeof error === 'string') {
      return {
        name: 'AppError',
        message: error,
        stack: new Error().stack
      }
    }

    if (error instanceof Error) {
      return error as AppError
    }

    // 尝试从对象中提取错误信息
    const errorObj = error as {
      message?: string
      stack?: string
      code?: string
      statusCode?: number
      details?: unknown
      isRetryable?: boolean
    }

    return {
      name: 'AppError',
      message: errorObj?.message || 'Unknown error',
      stack: errorObj?.stack,
      code: errorObj?.code,
      statusCode: errorObj?.statusCode,
      details: errorObj?.details,
      isRetryable: errorObj?.isRetryable
    }
  }

  // 分类错误
  private classifyError(error: AppError): ErrorType {
    if (
      error.name === 'NetworkError' ||
      error.message.includes('network') ||
      error.message.includes('fetch')
    ) {
      return ErrorType.NETWORK
    }

    if (error.statusCode === 401 || error.message.includes('unauthorized')) {
      return ErrorType.AUTH
    }

    if (error.statusCode === 400 || error.name === 'ValidationError') {
      return ErrorType.VALIDATION
    }

    if (error.statusCode && error.statusCode >= 500) {
      return ErrorType.API
    }

    if (error.message.includes('database') || error.message.includes('sqlite')) {
      return ErrorType.DATABASE
    }

    return ErrorType.UNKNOWN
  }

  // 记录错误
  private logError(error: AppError, type: ErrorType, context?: string): void {
    const errorData = {
      type,
      message: error.message,
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.error('Error logged:', errorData)

    // 在开发环境下显示详细错误
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${type}]`)
      console.error('Error:', error)
      console.error('Context:', context)
      console.error('Stack:', error.stack)
      console.groupEnd()
    }
  }

  // 显示错误给用户
  private showErrorToUser(error: AppError, type: ErrorType): void {
    // 使用 antd message
    message.error(this.getUserFriendlyMessage(error, type))
  }

  // 获取用户友好的错误消息
  private getUserFriendlyMessage(error: AppError, type: ErrorType): string {
    // 根据错误类型返回用户友好的消息
    switch (type) {
      case ErrorType.NETWORK:
        return '网络连接失败，请检查您的网络连接后重试。'

      case ErrorType.API:
        if (error.statusCode === 500) {
          return '服务器内部错误，请稍后重试。'
        }
        if (error.statusCode === 503) {
          return '服务暂时不可用，请稍后重试。'
        }
        return '服务器处理请求时发生错误。'

      case ErrorType.VALIDATION:
        return error.message || '请检查您的输入是否正确。'

      case ErrorType.AUTH:
        return '您的登录已过期，请重新登录。'

      case ErrorType.DATABASE:
        return '数据操作失败，请重试。'

      default:
        return error.message || '发生了一个未知错误，请重试。'
    }
  }

  // 创建特定类型的错误
  static createNetworkError(message: string): AppError {
    return {
      name: 'NetworkError',
      message,
      code: 'NETWORK_ERROR',
      isRetryable: true
    }
  }

  static createAPIError(message: string, statusCode: number): AppError {
    return {
      name: 'APIError',
      message,
      statusCode,
      code: 'API_ERROR',
      isRetryable: statusCode >= 500
    }
  }

  static createValidationError(message: string, details?: unknown): AppError {
    return {
      name: 'ValidationError',
      message,
      code: 'VALIDATION_ERROR',
      details,
      isRetryable: false
    }
  }

  static createAuthError(message: string): AppError {
    return {
      name: 'AuthError',
      message,
      code: 'AUTH_ERROR',
      isRetryable: false
    }
  }
}

// 错误处理 Hook
export const useErrorHandler = (): {
  handleError: (error: unknown, context?: string) => void
  handleAsyncError: <T>(asyncFn: () => Promise<T>, context?: string) => Promise<T>
} => {
  const errorHandler = ErrorHandler.getInstance()

  const handleError = (error: unknown, context?: string): void => {
    errorHandler.handleError(error, context)
  }

  const handleAsyncError = async <T>(asyncFn: () => Promise<T>, context?: string): Promise<T> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error as Error, context)
      throw error
    }
  }

  return {
    handleError,
    handleAsyncError
  }
}

// 全局错误处理器
export const setupGlobalErrorHandlers = (): void => {
  const errorHandler = ErrorHandler.getInstance()

  // 处理未捕获的 JavaScript 错误
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, 'Global JavaScript Error')
    event.preventDefault()
  })

  // 处理未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    errorHandler.handleError(error, 'Unhandled Promise Rejection')
    event.preventDefault()
  })

  // 处理网络错误
  window.addEventListener('offline', () => {
    errorHandler.handleError(new Error('网络连接已断开'), 'Network Offline')
  })
}

export default ErrorHandler
