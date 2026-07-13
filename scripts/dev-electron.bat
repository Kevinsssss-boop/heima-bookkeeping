@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
set ELECTRON_RUN_AS_NODE=
set VITE_PORT=5173
echo 🚀 启动黑马记账 (Electron 桌面版)...
start "" /B node_modules\.bin\vite.cmd --port 5173
timeout /t 3 /nobreak >nul
echo 📦 启动 Electron 窗口...
node_modules\.bin\electron.cmd .
