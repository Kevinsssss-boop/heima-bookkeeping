/**
 * 数据存储工具
 * 自动检测运行环境：
 *   - Electron 环境：通过 IPC 读写本地文件
 *   - 浏览器环境：使用 localStorage（含 PWA 安装模式）
 */

const STORAGE_KEY = 'heima-jizhang-expenses';
const SETTINGS_KEY = 'heima-jizhang-settings';

/** 检测是否在 Electron 环境中 */
function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI;
}

// ========== 浏览器 localStorage 实现 ==========

function webGetExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('读取数据失败：', err);
    return [];
  }
}

function webSaveExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch (err) {
    console.error('保存数据失败：', err);
    return false;
  }
}

// ========== 导出的公共 API ==========

/** 读取所有支出记录 */
export async function getExpenses() {
  if (isElectron()) {
    try {
      return await window.electronAPI.getExpenses();
    } catch (err) {
      console.error('Electron IPC 读取失败，使用 localStorage 兜底：', err);
      return webGetExpenses();
    }
  }
  return webGetExpenses();
}

/** 添加一条支出记录 */
export function addExpense(expense) {
  if (isElectron()) {
    window.electronAPI.addExpense(expense);
    return true;
  }
  const expenses = webGetExpenses();
  expenses.push(expense);
  return webSaveExpenses(expenses);
}

/** 更新一条支出记录 */
export function updateExpense(updatedExpense) {
  if (isElectron()) {
    window.electronAPI.updateExpense(updatedExpense);
    return true;
  }
  const expenses = webGetExpenses();
  const index = expenses.findIndex((e) => e.id === updatedExpense.id);
  if (index !== -1) {
    expenses[index] = updatedExpense;
    return webSaveExpenses(expenses);
  }
  return false;
}

/** 删除一条支出记录 */
export function deleteExpense(id) {
  if (isElectron()) {
    window.electronAPI.deleteExpense(id);
    return true;
  }
  const expenses = webGetExpenses();
  return webSaveExpenses(expenses.filter((e) => e.id !== id));
}

// ========== 设置（预算等）==========

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { monthlyBudget: 0 };
  } catch {
    return { monthlyBudget: 0 };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
