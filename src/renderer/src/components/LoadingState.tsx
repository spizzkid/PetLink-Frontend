import React from 'react'
import { Spin, Alert } from 'antd'

interface LoadingStateProps {
  loading: boolean
  error?: string | null
  size?: 'small' | 'default' | 'large'
  tip?: string
  children: React.ReactNode
  className?: string
}

const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  size = 'default',
  tip = '加载中...',
  children,
  className = ''
}) => {
  if (error) {
    return <Alert message="错误" description={error} type="error" showIcon className={className} />
  }

  if (loading) {
    return (
      <div className={`loading-container ${className}`}>
        <Spin size={size} tip={tip} />
      </div>
    )
  }

  return <>{children}</>
}

export default LoadingState
