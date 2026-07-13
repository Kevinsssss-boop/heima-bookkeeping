import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './App.css';

console.log('🟢 K记 启动中...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ 找不到 #root 元素！');
} else {
  console.log('✅ #root 元素已找到，开始渲染');
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
