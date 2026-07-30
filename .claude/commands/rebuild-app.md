---
description: 重新打包 K记 App（Vite 构建 + 可选 Electron 打包）
allowed-tools: [Bash, PowerShell, Read, Write]
---

# Rebuild App

重新构建并打包 K记 App。

---

## 构建流程

按以下步骤依次执行，**每步完成后告知用户结果**，遇到错误立即停止并报告。

### 第 1 步：Vite 前端构建

运行命令：

```bash
npx vite build
```

在项目根目录 `c:\Users\kevin\Desktop\黑马记账app` 下执行。

**预期结果**：输出到 `dist/` 目录，显示类似：
```
✓ built in xxxms
```

如果构建失败，把错误信息展示给用户，不要继续下一步。

### 第 2 步：确认构建产物

检查 `dist/` 目录是否生成成功：

```bash
ls -la dist/
```

确认以下文件存在：
- `dist/index.html`
- `dist/assets/` （包含 JS/CSS 文件）

### 第 3 步：询问用户是否需要 Electron 打包

问用户：

"前端已构建完成 ✅ 是否还需要打包成 Windows 桌面程序（.exe）？"

选项：
- **便携版**（单个 .exe 文件，免安装，双击即用）
- **安装版**（NSIS 安装包，带安装向导和卸载程序）
- **都不要**（只保留 dist/ 构建产物即可）
- **两个都要**

根据用户选择执行对应命令：

| 用户选择 | 执行命令 |
|---------|---------|
| 便携版 | `npm run build:win` |
| 安装版 | `npm run build:installer` |
| 两个都要 | 先执行 `npm run build:win`，再执行 `npm run build:installer` |
| 都不要 | 跳过，直接结束 |

> ⚠️ Electron 打包可能需要几分钟时间，请耐心等待。

### 第 4 步：报告结果

打包完成后，告诉用户输出文件位置：

- **便携版**：`release/K记.exe`
- **安装版**：`release/K记 Setup x.x.x.exe`

---

## 注意事项

1. 如果之前有旧的 `dist/` 目录，Vite 会自动清空重建，无需手动删除
2. 如果 Electron 打包失败，常见原因：
   - 端口被占用 → 关闭占用端口的进程后重试
   - 磁盘空间不足 → 清理空间后重试
3. 打包过程中**不要中断**，否则可能产生不完整的文件
4. 构建完成后如果用户想启动测试，可以提示输入 `/run` 来启动 App