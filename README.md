# 📒 K记

> 一款简洁、易用的个人桌面记账应用

![平台](https://img.shields.io/badge/平台-Windows%20%7C%20macOS-blue)
![技术栈](https://img.shields.io/badge/技术栈-Electron--React--Ant_Design-green)
![许可证](https://img.shields.io/badge/许可证-MIT-yellow)

## ✨ 功能特性

- 📝 **记录支出** — 输入金额、选择分类（两级联动）、日期和备注，一键保存
- 🏷️ **自定义分类** — 11 个预置大类 + 55 个预置小类，支持新增、修改、删除自己的分类
- 🎨 **小类图标** — 每个二级小类都配有专属 emoji 图标，一目了然
- 📊 **月度统计** — 按月汇总支出，饼图展示各分类占比
- 🔍 **搜索筛选** — 按分类、月份快速查找账单
- 💰 **预算管理** — 设定月度预算，超支时自动提醒
- 💻 **桌面应用** — Electron 全屏窗口，像普通软件一样使用
- 🔒 **数据本地** — 所有数据保存在本机，不联网、不上云

## 📸 界面预览

| 主页面 | 记一笔 | 分类管理 |
|:---:|:---:|:---:|
| 账单列表 + 统计图表 | 两级分类选择 + 金额输入 | 自定义增删改分类 |

## 🗂️ 支出分类体系

采用**两级分类**结构：一级大类 → 二级小类

| 一级分类 | 二级小类举例 |
|---------|------------|
| 🍜 餐饮 | 早餐、午餐、晚餐、零食小吃、饮品咖啡、朋友聚餐 |
| 🚗 交通 | 公交/地铁、出租车/网约车、加油充电、停车费… |
| 🛒 购物 | 日用百货、服装鞋帽、数码产品、家居用品… |
| 🏠 住房 | 房租、水费、电费、燃气费、物业费… |
| 🎮 娱乐 | 电影演出、游戏充值、音乐/视频会员、旅游出行… |
| 💊 医疗 | 门诊挂号、药品购买、住院治疗、体检检查 |
| 📚 教育 | 课程/培训、书籍购买、文具用品、考试报名 |
| 📱 通讯 | 手机话费、宽带网费、快递邮寄 |
| 👥 人情往来 | 红包/礼金、请客吃饭、节日礼物 |
| 💰 金融理财 | 保险支出、投资亏损、银行手续费 |
| 📦 其他 | 其他支出 |

> 预置分类不可修改，但可以追加自定义二级小类。

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) | 桌面应用框架 |
| [React 18](https://react.dev/) | 前端 UI 框架 |
| [Ant Design 5](https://ant.design/) | UI 组件库 |
| [Vite 5](https://vitejs.dev/) | 构建工具 |
| [Recharts](https://recharts.org/) | 图表统计 |
| [Day.js](https://day.js/) | 日期处理 |

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://gitee.com/kevinkevinsssss/the-k-notation-app.git
cd the-k-notation-app

# 2. 安装依赖
npm install

# 3. 启动桌面应用（推荐）
npm run electron

# 或者启动浏览器版（备用）
npm run dev        # 开发模式 → http://localhost:5200
```

### 其他命令

```bash
npm run build              # 构建生产版本
npm run preview            # 预览构建结果
npm run build:win          # 打包 Windows 便携版 (.exe)
npm run build:installer    # 打包 Windows 安装包 (.exe 安装程序)
```

## 📁 项目结构

```
K记app/
├── main.cjs                  # Electron 主进程
├── preload.cjs               # Electron 预加载脚本
├── index.html                # 入口 HTML
├── vite.config.js            # Vite 配置
├── package.json              # 项目配置
├── scripts/                  # 构建和启动脚本
├── public/                   # 静态资源（图标等）
├── src/
│   ├── main.jsx              # React 入口
│   ├── App.jsx               # 主应用组件
│   ├── App.css               # 全局样式
│   ├── data/categories.js    # 支出分类数据
│   ├── components/           # 页面组件
│   │   ├── ExpenseList.jsx       # 账单列表
│   │   ├── AddExpenseModal.jsx   # 记一笔弹窗
│   │   ├── CategoryManager.jsx   # 分类管理
│   │   ├── Dashboard.jsx         # 总览仪表盘
│   │   ├── StatsView.jsx         # 统计分析
│   │   └── Sidebar.jsx           # 侧边栏导航
│   └── utils/
│       ├── storage.js            # 数据存储（双模式）
│       └── helpers.js            # 工具函数
└── dist/                     # 构建产物
```

## 💾 数据存储

| 运行方式 | 存储位置 | 说明 |
|---------|---------|------|
| **Electron 桌面版** | 用户目录下的 `expenses.json` | 本地 JSON 文件，通过 IPC 读写 |
| **浏览器版** | `localStorage` | 浏览器本地存储 |

所有数据保存在用户电脑本地，**不会上传到任何服务器**。

## 📋 版本记录

| 版本 | 说明 |
|------|------|
| 存档2 | 用户可自定义分类及二级小类图标；点击小类可改名；账单金额对齐优化 |
| 存档1 | 初始化项目：Electron + React 全屏桌面记账应用，含分类选择、图表统计、预算功能 |

## 📄 许可证

[MIT License](LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://gitee.com/kevinkevinsssss">Kevin</a>
</p>
