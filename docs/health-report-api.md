# PetLink 宠物健康报告 API - 前端调用文档

## 基础信息

- **API 地址**: `https://api.chonglianlian.online`
- **API 文档**: `https://api.chonglianlian.online/docs`
- **支持格式**: 仅支持 `.docx` 格式的 Word 文档
- **分析模式**: `健康关注` 或 `疾病诊断`

## 1. 文件上传 API

### 接口信息
- **URL**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **描述**: 上传 Word 文档并开始生成宠物健康报告

### 请求参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| file | File | 是 | Word 文档文件（.docx 格式） |
| mode | String | 否 | 分析模式，默认为 "健康关注" |

### 请求示例

#### JavaScript (Fetch)
```javascript
const uploadFile = async (file, mode = "健康关注") => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  try {
    const response = await fetch('https://api.chonglianlian.online/api/upload', {
      method: 'POST',
      body: formData,
      // 不需要设置 Content-Type，浏览器会自动设置
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.detail || '上传失败');
    }

    return result;
  } catch (error) {
    console.error('上传失败:', error);
    throw error;
  }
};

// 使用示例
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

if (file) {
  const result = await uploadFile(file, "健康关注");
  console.log('上传成功:', result);
  // 返回结果包含 task_id，用于后续查询状态
}
```

#### React (Axios)
```javascript
import axios from 'axios';

const uploadFile = async (file, mode = "健康关注") => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  try {
    const response = await axios.post(
      'https://api.chonglianlian.online/api/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('上传失败:', error);
    throw error;
  }
};
```

### 响应结果
```json
{
  "task_id": "uuid-string",
  "message": "文件上传成功，正在生成报告...",
  "status_url": "/api/status/{task_id}"
}
```

## 2. 查询任务状态 API

### 接口信息
- **URL**: `GET /api/status/{task_id}`
- **描述**: 查询报告生成状态

### 请求示例

#### JavaScript (Fetch)
```javascript
const checkStatus = async (taskId) => {
  try {
    const response = await fetch(`https://api.chonglianlian.online/api/status/${taskId}`);
    
    if (!response.ok) {
      throw new Error('查询状态失败');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('查询状态失败:', error);
    throw error;
  }
};

// 使用示例 - 轮询查询状态
const pollStatus = async (taskId) => {
  const maxAttempts = 60; // 最多尝试60次
  const interval = 5000; // 每5秒查询一次
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkStatus(taskId);
    console.log('当前状态:', status);
    
    if (status.status === 'completed') {
      return status; // 生成完成
    } else if (status.status === 'failed') {
      throw new Error('报告生成失败');
    }
    
    // 等待下一次查询
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('查询超时');
};
```

### 响应结果
```json
{
  "task_id": "uuid-string",
  "status": "processing|completed|failed",
  "message": "处理状态描述",
  "progress": 85,
  "result": {
    "filename": "原始文件名.docx",
    "mode": "健康关注",
    "processing_time": "45秒"
  },
  "pdf_url": "/api/download/{task_id}"
}
```

### 状态说明
- `processing`: 正在处理中
- `completed`: 生成完成
- `failed`: 生成失败

## 3. 下载报告 API

### 接口信息
- **URL**: `GET /api/download/{task_id}`
- **描述**: 下载生成的 PDF 报告
- **返回**: PDF 文件流

### 请求示例

#### JavaScript (Fetch)
```javascript
const downloadReport = async (taskId) => {
  try {
    const response = await fetch(`https://api.chonglianlian.online/api/download/${taskId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '下载失败');
    }

    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || '宠物健康报告.pdf'
      : '宠物健康报告.pdf';

    // 创建下载链接
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, filename };
  } catch (error) {
    console.error('下载失败:', error);
    throw error;
  }
};
```

#### React (下载组件)
```javascript
import React, { useState } from 'react';

const DownloadButton = ({ taskId, disabled }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`https://api.chonglianlian.online/api/download/${taskId}`);
      
      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '宠物健康报告.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      disabled={disabled || downloading}
    >
      {downloading ? '下载中...' : '下载报告'}
    </button>
  );
};
```

## 4. 完整流程示例

### React 组件示例
```javascript
import React, { useState } from 'react';

const PetHealthReportUploader = () => {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('健康关注');
  const [uploading, setUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
    } else {
      alert('请选择 .docx 格式的 Word 文档');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const response = await fetch('https://api.chonglianlian.online/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setTaskId(result.task_id);
      startPolling(result.task_id);
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const startPolling = async (id) => {
    setPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`https://api.chonglianlian.online/api/status/${id}`);
        const result = await response.json();
        setStatus(result);

        if (result.status === 'completed' || result.status === 'failed') {
          clearInterval(pollInterval);
          setPolling(false);
        }
      } catch (error) {
        console.error('查询状态失败:', error);
        clearInterval(pollInterval);
        setPolling(false);
      }
    }, 5000);
  };

  const handleDownload = async () => {
    if (!taskId) return;

    try {
      const response = await fetch(`https://api.chonglianlian.online/api/download/${taskId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '宠物健康报告.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  return (
    <div>
      <h2>宠物健康报告生成器</h2>
      
      <div>
        <input 
          type="file" 
          accept=".docx" 
          onChange={handleFileChange} 
          disabled={uploading}
        />
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          disabled={uploading}
        >
          <option value="健康关注">健康关注</option>
          <option value="疾病诊断">疾病诊断</option>
        </select>
        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
        >
          {uploading ? '上传中...' : '开始生成报告'}
        </button>
      </div>

      {polling && status && (
        <div>
          <h3>处理状态</h3>
          <p>状态: {status.status}</p>
          <p>进度: {status.progress}%</p>
          <p>消息: {status.message}</p>
        </div>
      )}

      {status && status.status === 'completed' && (
        <div>
          <h3>报告生成完成！</h3>
          <button onClick={handleDownload}>下载报告</button>
        </div>
      )}

      {status && status.status === 'failed' && (
        <div>
          <h3>生成失败</h3>
          <p>请重试或联系管理员</p>
        </div>
      )}
    </div>
  );
};

export default PetHealthReportUploader;
```

## 5. 错误处理

### 常见错误码
- `400`: 请求参数错误
- `404`: 任务不存在
- `500`: 服务器内部错误

### 错误处理示例
```javascript
const handleError = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        alert('请求参数错误：' + (error.response.data.detail || '请检查输入'));
        break;
      case 404:
        alert('任务不存在或已过期');
        break;
      case 500:
        alert('服务器错误，请稍后重试');
        break;
      default:
        alert('请求失败，请重试');
    }
  } else {
    alert('网络错误，请检查网络连接');
  }
};
```

## 6. 注意事项

1. **文件格式**: 仅支持 `.docx` 格式的 Word 文档
2. **文件大小**: 建议单个文件不超过 10MB
3. **处理时间**: 生成报告通常需要 30-60 秒
4. **轮询间隔**: 建议每 5 秒查询一次状态
5. **超时处理**: 建议设置 5-10 分钟的超时时间
6. **CORS**: API 已配置 CORS，支持跨域请求

## 7. 测试工具

可以使用以下工具测试 API：

- **Postman**: 导入 API 文档进行测试
- **curl**: 命令行测试
- **浏览器开发者工具**: 直接在浏览器中测试

### curl 测试示例
```bash
# 上传文件
curl -X POST "https://api.chonglianlian.online/api/upload" \
  -F "file=@/path/to/document.docx" \
  -F "mode=健康关注"

# 查询状态
curl -X GET "https://api.chonglianlian.online/api/status/{task_id}"

# 下载报告
curl -X GET "https://api.chonglianlian.online/api/download/{task_id}" \
  -o report.pdf
```