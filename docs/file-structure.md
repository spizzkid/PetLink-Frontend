src/
├── main/
│ └── index.ts # 主进程入口文件
├── preload/
│ └── index.ts # 预加载脚本
├── renderer/
│ ├── index.html # HTML 入口文件
│ └── src/
│ ├── components/ # 界面组件
│ │ ├── Sidebar.tsx # 侧边栏组件
│ │ ├── Dashboard.tsx # 数据仪表盘组件
│ │ └── Card.tsx # 统计卡片组件
│ ├── pages/ # 页面代码
│ │ ├── Home.tsx # 首页
│ │ ├── HealthCheck.tsx # 健康检测页面
│ │ ├── PetManagement.tsx # 宠物管理页面
│ │ └── ClientManagement.tsx # 客户管理页面
│ ├── assets/ # 静态资源
│ │ ├── base.css # 基础样式
│ │ ├── main.css # 主样式
│ │ ├── electron.svg # 图标
│ │ └── images/ # 图片资源
│ ├── utils/ # 工具函数
│ │ └── api.ts # API 请求封装
│ ├── App.tsx # 渲染进程入口文件
│ └── main.tsx # React 入口文件
