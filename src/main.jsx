/**
 * K记 Electron 应用入口文件（主进程）
 *
 * 职责：
 *   1. 创建浏览器窗口（BrowserWindow）
 *   2. 配置窗口属性（尺寸、图标、是否全屏等）
 *   3. 挂载 React 应用到窗口中
 *   4. 暴露 IPC 通信接口给渲染进程（通过 preload 脚本）
 *
 * 安全配置：
 *   - contextIsolation: true（隔离主/渲染进程，防 RCE）
 *   - nodeIntegration: false（禁用 Node.js API 在渲染进程）
 *   - webSecurity: true（启用同源安全策略）
 *
 * 数据存储：
 *   - 支出记录：userData/expenses.json
 *   - 自定义分类：userData/custom-categories.json
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './App.css';

// 开发模式提示（方便调试，生产环境可移除）
console.log('🟢 K记 启动中...');

/** 查找挂载点 */
const root = document.getElementById('root');
if (!root) {
  console.error('❌ 找不到 #root 元素！请检查 index.html 是否存在');
} else {
  console.log('✅ #root 元素已找到，开始渲染 React 应用');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
          },
        }}
      >
        <App />
      </ConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
