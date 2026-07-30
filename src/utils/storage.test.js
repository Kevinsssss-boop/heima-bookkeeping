import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getSettings,
  saveSettings,
  getCustomCategoriesData,
  saveCustomCategoriesData,
} from './storage';

// ========== Mock localStorage ==========
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get store() { return store; },
    _reset() { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ========== Mock Electron API ==========
const electronAPIMock = {
  getExpenses: vi.fn(),
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getCustomCategories: vi.fn(),
  saveCustomCategories: vi.fn(),
};

describe('数据存储 storage.js', () => {

  beforeEach(() => {
    localStorageMock._reset();
    vi.clearAllMocks();
    // 默认非 Electron 环境
    delete globalThis.window;
    globalThis.window = { localStorage: localStorageMock };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ====== 浏览器模式（localStorage）======

  describe('浏览器模式：getExpenses()', () => {

    it('localStorage 为空时应该返回空数组', async () => {
      const result = await getExpenses();
      expect(result).toEqual([]);
    });

    it('localStorage 有数据时应该正确解析', async () => {
      const mockData = [
        { id: 'test-1', amount: 20, category1: '餐饮', category2: '午餐', date: '2026-07-29', note: '', createdAt: '2026-07-29T00:00:00Z' },
      ];
      localStorageMock.setItem('heima-jizhang-expenses', JSON.stringify(mockData));

      const result = await getExpenses();
      expect(result).toEqual(mockData);
      expect(result.length).toBe(1);
    });

    it('localStorage 数据损坏时应该返回空数组（容错）', async () => {
      localStorageMock.setItem('heima-jizhang-expenses', '不是合法的JSON{{{');
      const result = await getExpenses();
      expect(result).toEqual([]);
    });
  });

  describe('浏览器模式：addExpense()', () => {

    it('应该能正确添加一笔支出记录', () => {
      const newExpense = {
        id: 'new-1',
        amount: 35.50,
        category1: '购物',
        category2: '数码产品',
        date: '2026-07-29',
        note: '买耳机',
      };

      const result = addExpense(newExpense);
      expect(result).toBe(true);

      // 验证已写入 localStorage
      const saved = JSON.parse(localStorageMock.getItem('heima-jizhang-expenses'));
      expect(saved.length).toBe(1);
      expect(saved[0].id).toBe('new-1');
      expect(saved[0].amount).toBe(35.50);
    });

    it('连续添加多笔记录应该都能保存', () => {
      addExpense({ id: 'e1', amount: 10, category1: '餐饮', category2: '早餐', date: '2026-07-28', note: '' });
      addExpense({ id: 'e2', amount: 20, category1: '餐饮', category2: '午餐', date: '2026-07-29', note: '' });
      addExpense({ id: 'e3', amount: 99.99, category1: '娱乐', category2: '游戏充值', date: '2026-07-29', note: '充值' });

      const saved = JSON.parse(localStorageMock.getItem('heima-jizhang-expenses'));
      expect(saved.length).toBe(3);
    });
  });

  describe('浏览器模式：updateExpense()', () => {

    it('应该能正确修改已有记录', () => {
      // 先添加一条
      addExpense({ id: 'u1', amount: 50, category1: '交通', category2: '打车', date: '2026-07-29', note: '' });

      // 修改它
      const updated = { id: 'u1', amount: 55, category1: '交通', category2: '打车', date: '2026-07-29', note: '加了小费' };
      const result = updateExpense(updated);
      expect(result).toBe(true);

      const saved = JSON.parse(localStorageMock.getItem('heima-jizhang-expenses'));
      expect(saved[0].amount).toBe(55);
      expect(saved[0].note).toBe('加了小费');
    });

    it('修改不存在的记录应该返回 false', () => {
      const result = updateExpense({ id: '不存在', amount: 999 });
      expect(result).toBe(false);
    });
  });

  describe('浏览器模式：deleteExpense()', () => {

    it('应该能正确删除指定记录', () => {
      addExpense({ id: 'd1', amount: 10, category1: '餐饮', category2: '早餐', date: '2026-07-29', note: '' });
      addExpense({ id: 'd2', amount: 20, category1: '餐饮', category2: '午餐', date: '2026-07-29', note: '' });

      const result = deleteExpense('d1');
      expect(result).toBe(true);

      const saved = JSON.parse(localStorageMock.getItem('heima-jizhang-expenses'));
      expect(saved.length).toBe(1);
      expect(saved[0].id).toBe('d2');
    });

    it('删除唯一记录后列表应为空', () => {
      addExpense({ id: 'only', amount: 5, category1: '其他', category2: '其他支出', date: '2026-07-29', note: '' });
      deleteExpense('only');

      const saved = JSON.parse(localStorageMock.getItem('heima-jizhang-expenses'));
      expect(saved.length).toBe(0);
    });
  });

  // ====== 设置相关 ======

  describe('getSettings()', () => {

    it('没有设置时应该返回默认预算为 0', () => {
      const settings = getSettings();
      expect(settings).toEqual({ monthlyBudget: 0 });
    });

    it('有设置数据时应该正确解析', () => {
      localStorageMock.setItem('heima-jizhang-settings', JSON.stringify({ monthlyBudget: 3000 }));
      const settings = getSettings();
      expect(settings.monthlyBudget).toBe(3000);
    });

    it('数据损坏时应该返回默认值', () => {
      localStorageMock.setItem('heima-jizhang-settings', '损坏的数据');
      const settings = getSettings();
      expect(settings).toEqual({ monthlyBudget: 0 });
    });
  });

  describe('saveSettings()', () => {

    it('应该能正确保存设置', () => {
      const result = saveSettings({ monthlyBudget: 5000 });
      expect(result).toBe(true);

      const saved = JSON.parse(localStorageMock.getItem('heima-jizhang-settings'));
      expect(saved.monthlyBudget).toBe(5000);
    });
  });

  // ====== 自定义分类 ======

  describe('getCustomCategoriesData() 浏览器模式', () => {

    it('没有自定义分类时应该返回空数据结构', async () => {
      const data = await getCustomCategoriesData();
      expect(data.customCategories).toEqual([]);
      expect(data.customSubCategories).toEqual({});
    });

    it('有自定义分类数据时应该正确解析', async () => {
      const mockData = {
        customCategories: [{ id: 'c1', label: '宠物', icon: '🐱', children: [] }],
        customSubCategories: {},
      };
      localStorageMock.setItem('heima-jizhang-custom-categories', JSON.stringify(mockData));

      const data = await getCustomCategoriesData();
      expect(data.customCategories.length).toBe(1);
      expect(data.customCategories[0].label).toBe('宠物');
    });

    it('数据缺少字段时应该补全默认值', async () => {
      localStorageMock.setItem('heima-jizhang-custom-categories', JSON.stringify({}));
      const data = await getCustomCategoriesData();
      expect(data.customCategories).toEqual([]);
      expect(data.customSubCategories).toEqual({});
    });
  });

  describe('saveCustomCategoriesData() 浏览器模式', () => {

    it('应该能正确保存自定义分类数据', () => {
      const data = {
        customCategories: [{ id: 'c1', label: '运动', icon: '⚽', children: [] }],
        customSubCategories: {},
      };
      const result = saveCustomCategoriesData(data);
      expect(result).toBe(true);

      const saved = JSON.parse(localStorageMock.getItem('heima-jizhang-custom-categories'));
      expect(saved.customCategories.length).toBe(1);
    });
  });

  // ====== Electron 模式 ======

  describe('Electron 模式', () => {

    beforeEach(() => {
      globalThis.window = {
        ...globalThis.window,
        electronAPI: electronAPIMock,
      };
    });

    it('getExpenses() 在 Electron 模式下应该调用 IPC', async () => {
      const mockExpenses = [{ id: 'elec-1', amount: 100 }];
      electronAPIMock.getExpenses.mockResolvedValue(mockExpenses);

      const result = await getExpenses();
      expect(electronAPIMock.getExpenses).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockExpenses);
    });

    it('addExpense() 在 Electron 模式下应该调用 IPC', () => {
      const expense = { id: 'e1', amount: 50 };
      const result = addExpense(expense);
      expect(electronAPIMock.addExpense).toHaveBeenCalledWith(expense);
      expect(result).toBe(true);
    });

    it('updateExpense() 在 Electron 模式下应该调用 IPC', () => {
      const expense = { id: 'e1', amount: 60 };
      const result = updateExpense(expense);
      expect(electronAPIMock.updateExpense).toHaveBeenCalledWith(expense);
      expect(result).toBe(true);
    });

    it('deleteExpense() 在 Electron 模式下应该调用 IPC', () => {
      const result = deleteExpense('e1');
      expect(electronAPIMock.deleteExpense).toHaveBeenCalledWith('e1');
      expect(result).toBe(true);
    });

    it('saveCustomCategoriesData() 在 Electron 模式下应该调用 IPC', () => {
      const data = { customCategories: [], customSubCategories: {} };
      const result = saveCustomCategoriesData(data);
      expect(electronAPIMock.saveCustomCategories).toHaveBeenCalledWith(data);
      expect(result).toBe(true);
    });

    it('Electron IPC 失败时 getExpenses 应该回退到 localStorage', async () => {
      electronAPIMock.getExpenses.mockRejectedValue(new Error('IPC error'));

      // 预先在 localStorage 放入数据作为兜底
      localStorageMock.setItem('heima-jizhang-expenses', JSON.stringify([{ id: 'fallback', amount: 1 }]));

      const result = await getExpenses();
      // 应该回退到 localStorage 的数据
      expect(result).toEqual([{ id: 'fallback', amount: 1 }]);
    });
  });
});
