import React, { useState } from 'react'
import { Button, Card, Typography, Space, message } from 'antd'

const { Text } = Typography

const NetworkDiagnostics: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (result: string): void => {
    setResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`])
  }

  const runDiagnostics = async (): Promise<void> => {
    setTesting(true)
    setResults([])

    try {
      addResult('开始网络诊断...')

      // Test DNS resolution
      addResult('测试 DNS 解析...')
      const dnsResult = await window.api.testDNS('api.chonglianlian.cn')
      if (dnsResult.success) {
        addResult(`✅ DNS 解析成功: api.chonglianlian.cn -> ${dnsResult.address}`)
      } else {
        addResult(`❌ DNS 解析失败: ${dnsResult.error}`)
      }

      // Test connection to API
      addResult('测试 API 连接...')
      const connResult = await window.api.testConnection(
        'http://api.chonglianlian.cn/api/v1/health'
      )
      if (connResult.success) {
        addResult(`✅ API 连接成功: HTTP ${connResult.status} ${connResult.statusText}`)
      } else {
        addResult(`❌ API 连接失败: ${connResult.error} (${connResult.code})`)
      }

      // Test AI API
      addResult('测试 AI API 连接...')
      const aiConnResult = await window.api.testConnection('http://api.chonglianlian.online')
      if (aiConnResult.success) {
        addResult(`✅ AI API 连接成功: HTTP ${aiConnResult.status} ${aiConnResult.statusText}`)
      } else {
        addResult(`❌ AI API 连接失败: ${aiConnResult.error} (${aiConnResult.code})`)
      }

      addResult('诊断完成')
      message.success('网络诊断完成')
    } catch (error) {
      addResult(`❌ 诊断过程出错: ${error}`)
      message.error('诊断过程出错')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card title="网络诊断" style={{ margin: '16px 0' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" onClick={runDiagnostics} loading={testing} disabled={testing}>
          {testing ? '正在诊断...' : '开始网络诊断'}
        </Button>

        {results.length > 0 && (
          <div
            style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              maxHeight: '300px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          >
            {results.map((result, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                <Text>{result}</Text>
              </div>
            ))}
          </div>
        )}
      </Space>
    </Card>
  )
}

export default NetworkDiagnostics
