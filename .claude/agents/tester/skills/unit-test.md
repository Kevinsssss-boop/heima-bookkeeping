---
description: 为当前项目创建单元测试（Vitest 技术栈），编写测试代码、执行测试并生成测试报告
allowed-tools: [Bash, PowerShell, Read, Write, Edit, Glob, Grep]
---

# Unit Test

为当前项目创建和运行单元测试，使用 **Vitest** 作为测试框架。

---

## 前置知识（向用户解释时用）

如果用户问"什么是单元测试"，用大白话解释：

- **单元测试** = 给代码写"考卷"，自动检查代码有没有 bug
- **执行测试** = 让电脑按考卷逐一打分
- **测试报告** = 成绩单，告诉你哪些通过、哪些失败、为什么失败

---

## 完整流程

按以下步骤依次执行，**每步完成后告知用户结果**。

### 第 0 步：环境检查

检查当前项目是否已经配置了 Vitest：

```bash
cat package.json | grep -E "vitest|@testing"
```

**情况 A — 已安装 Vitest**：跳到第 2 步

**情况 B — 未安装**：进入第 1 步进行初始化

---

### 第 1 步：初始化测试环境（仅首次需要）

#### 1.1 安装依赖

在项目根目录执行：

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react happy-dom @vitest/coverage-v8
```

> 用大白话告诉用户："正在安装测试工具包，就像给工人配备检测仪器一样"

#### 1.2 在 package.json 中添加测试脚本

在 `package.json` 的 `scripts` 部分添加：

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

> 如果已有 test 脚本则覆盖，没有则追加。

#### 1.3 创建 Vitest 配置文件

在项目根目录创建 `vitest.config.js`：

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'node_modules/**'],
    },
    include: [
      'src/**/*.{test,spec}.{js,jsx}',
      'tests/**/*.{test,spec}.{js,jsx}',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 1.4 创建测试入口目录

```bash
mkdir -p src/__tests__
```

完成后告知用户："✅ 测试环境初始化完成！已安装 Vitest + 配置完成"

---

### 第 2 步：分析代码，确定测试范围

扫描项目的源代码，找出所有可测试的模块：

```
优先级从高到低：

🔴 高优先级（核心业务逻辑，必须测）：
   ├── src/utils/*.js        → 工具函数、数据存储逻辑
   └── src/data/*.js         → 数据处理、分类合并逻辑

🟡 中优先级（重要功能组件）：
   └── src/components/*.jsx   → 组件核心逻辑、状态管理

🟢 低优先级（UI 展示类，可选）：
   └── 纯展示组件 / 样式相关代码
```

将分析结果展示给用户，然后问："要对哪些部分创建测试？"

选项：
- **全部都测**（推荐）
- **只测工具函数**（快，覆盖核心逻辑）
- **自定义选择**（让用户指定文件）

---

### 第 3 步：编写测试代码

根据用户选择的范围，逐个创建测试文件。

#### 测试文件命名规范

| 源文件 | 测试文件位置 |
|--------|------------|
| `src/utils/helpers.js` | `src/utils/helpers.test.js` |
| `src/utils/storage.js` | `src/utils/storage.test.js` |
| `src/data/categories.js` | `src/data/categories.test.js` |
| `src/components/Xxx.jsx` | `src/components/Xxx.test.jsx` |

#### 测试代码模板

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

describe('模块名（中文）', () => {

  describe('函数名/功能点（中文）', () => {

    it('正常情况描述', () => {
      // 准备数据 → 执行操作 → 断言结果
      expect(结果).toBe(期望值);
    });

    it('边界情况描述', () => { /* ... */ });
    it('异常情况描述', () => { /* ... */ });
  });
});
```

#### Mock 外部依赖规则

- `window.electronAPI` → 用 mock 对象替代
- `localStorage` → 用自定义 mock 注入 `globalThis.localStorage`
- Ant Design / Recharts 组件 → 用 `vi.mock()` 返回简化版
- 纯函数库（dayjs 等）→ 通常不需要 mock

---

### 第 4 步：执行测试

```bash
npx vitest run
```

实时反馈结果给用户。

---

### 第 5 步：生成报告

运行覆盖率测试：

```bash
npx vitest run --coverage
```

输出格式化的测试报告（通过数/失败数/覆盖率/耗时等）。

---

### 第 6 步：后续建议

根据结果给出改进建议。

---

## 注意事项

1. **首次运行需要安装依赖**，耗时约 1-2 分钟
2. **不要测试 `main.jsx` 和 `App.jsx`**
3. **测试文件放在源码同目录下**
4. **每个测试用例要独立**
5. 如果用户中途取消，保留已创建的测试文件
