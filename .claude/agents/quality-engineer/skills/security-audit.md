---
description: 代码安全审计：检查敏感信息泄露、注入漏洞、配置安全等安全隐患
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, PowerShell]
---

# Security Audit（安全审计）

对项目代码进行全面的安全隐患扫描。详见全局命令 `security-audit.md`，以下是执行摘要。

---

## 6 大检查类别

### 🔴 类别 1：敏感信息硬编码
搜索：password, secret, api_key, token, 私钥, 数据库连接串, JWT Secret

### 🔴 类别 2：注入漏洞风险
搜索：SQL 拼接查询、eval()、innerHTML、命令拼接

### 🟡 类别 3：配置文件安全
检查：.env 泄露、.gitignore 配置、IPC 权限、package.json 可疑内容

### 🟡 类别 4：Electron 特有安全（本项目重点！）
检查：nodeIntegration（必须 false）、contextIsolation（必须 true）、webSecurity、contextBridge

### 🟢 类别 5：依赖包安全
运行：`npm audit` + `npm outdated`

### 🟢 类别 6：其他隐患
检查：console.log 残留、错误信息泄露、localStorage 敏感数据、硬编码路径

---

## 执行方式

```bash
# 类别1-2-6 的搜索命令（详见完整版技能文件）
grep -rn -i -E "(password|passwd|pwd|secret|api_key|token)\s*[=:]" src/ --include="*.js" --include="*.jsx" --include="*.cjs"
grep -rn -E "(eval|innerHTML|dangerouslySetInnerHTML)" src/ --include="*.js" --include="*.jsx"
grep -rn -E "(nodeIntegration|contextIsolation|webSecurity)" main.cjs
grep -rn "console\.(log|debug|info)" src/ --include="*.js" --include="*.jsx"
npm audit
```

## 输出要求

输出格式化的安全审计报告，包含：
- 总体评分（0-100）和等级（✅安全 / ⚠️有风险 / 🔴危险）
- 每个问题的：📍位置、💥风险说明、🔧修复建议、📖参考链接
- 按优先级排序的修复计划（立即/本周/下迭代）
- 免责声明

## 针对本项目的重点

⚠️ **Electron 安全** > 本地数据安全 > IPC 权限 > 依赖漏洞 > 注入风险（本项目无数据库）

> 完整内容请参考全局技能文件 `~/.claude/commands/security-audit.md`
