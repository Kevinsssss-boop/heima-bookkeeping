import { describe, it, expect } from 'vitest';
import {
  presetCategories,
  presetSubIcons,
  mergeCategories,
  getCategoryIcon,
  getMainCategories,
  getSubCategories,
} from './categories';

describe('分类数据 categories.js', () => {

  describe('presetCategories 预置分类数据', () => {

    it('应该包含 11 个一级分类', () => {
      expect(presetCategories.length).toBe(11);
    });

    it('每个一级分类都应该有 label、icon、children 属性', () => {
      presetCategories.forEach((cat) => {
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('children');
        expect(cat.children.length).toBeGreaterThan(0);
      });
    });

    it('应该包含餐饮分类，且有 6 个二级小类', () => {
      const food = presetCategories.find((c) => c.label === '餐饮');
      expect(food).toBeDefined();
      expect(food.icon).toBe('🍜');
      expect(food.children).toContain('早餐');
      expect(food.children).toContain('午餐');
      expect(food.children).toContain('晚餐');
      expect(food.children).toContain('零食小吃');
      expect(food.children).toContain('饮品咖啡');
      expect(food.children).toContain('朋友聚餐');
      expect(food.children.length).toBe(6);
    });

    it('应该包含其他分类作为兜底', () => {
      const other = presetCategories.find((c) => c.label === '其他');
      expect(other).toBeDefined();
      expect(other.icon).toBe('📦');
    });
  });

  describe('presetSubIcons 图标映射', () => {

    it('预置小类都应该有对应的图标', () => {
      // 收集所有预置小类名
      const allSubs = presetCategories.flatMap((c) => c.children);
      allSubs.forEach((sub) => {
        expect(presetSubIcons[sub]).toBeDefined();
        expect(typeof presetSubIcons[sub]).toBe('string');
        expect(presetSubIcons[sub].length).toBeGreaterThan(0);
      });
    });

    it('早餐的图标应该是 🌅', () => {
      expect(presetSubIcons['早餐']).toBe('🌅');
    });

    it('午餐的图标应该是 ☀️', () => {
      expect(presetSubIcons['午餐']).toBe('☀️');
    });
  });

  describe('mergeCategories() 合并分类', () => {

    it('空输入时应该返回只有预置分类的列表', () => {
      const result = mergeCategories(null);
      expect(result.length).toBe(presetCategories.length);
      result.forEach((cat) => {
        expect(cat.isPreset).toBe(true);
      });
    });

    it('undefined 输入时应该安全处理', () => {
      const result = mergeCategories(undefined);
      expect(result.length).toBe(presetCategories.length);
    });

    it('空对象输入时应该返回默认预置分类', () => {
      const result = mergeCategories({});
      expect(result.length).toBe(presetCategories.length);
    });

    it('应该将预置小类转换为带图标的对象格式', () => {
      const result = mergeCategories({});
      const food = result.find((c) => c.label === '餐饮');
      // 第一个子项应该是对象格式
      const firstChild = food.children[0];
      expect(firstChild).toHaveProperty('label');
      expect(firstChild).toHaveProperty('icon');
    });

    it('应该正确追加自定义一级分类', () => {
      const customData = {
        customCategories: [
          {
            id: 'cat-1',
            label: '宠物',
            icon: '🐱',
            children: [
              { id: 'sub-1', label: '猫粮', icon: '🍽️' },
              { id: 'sub-2', label: '狗粮', icon: '🥩' },
            ],
          },
        ],
        customSubCategories: {},
      };
      const result = mergeCategories(customData);

      // 应该有 11 个预置 + 1 个自定义 = 12 个
      expect(result.length).toBe(12);

      const petCat = result.find((c) => c.label === '宠物');
      expect(petCat).toBeDefined();
      expect(petCat.icon).toBe('🐱');
      expect(petCat.isPreset).toBe(false);
      expect(petCat.customId).toBe('cat-1');
      expect(petCat.children.length).toBe(2);
      expect(petCat.children[0].label).toBe('猫粮');
    });

    it('应该正确追加自定义二级小类到预置分类下', () => {
      const customData = {
        customCategories: [],
        customSubCategories: {
          '餐饮': [
            { id: 'sub-custom-1', label: '外卖', icon: '🛵' },
          ],
        },
      };
      const result = mergeCategories(customData);
      const food = result.find((c) => c.label === '餐饮');

      // 原有 6 个 + 自定义 1 个 = 7 个
      expect(food.children.length).toBe(7);

      // 最后一个应该是自定义的外卖
      const lastSub = food.children[food.children.length - 1];
      expect(lastSub.label).toBe('外卖');
      expect(lastSub.icon).toBe('🛵');
    });

    it('自定义小类没有图标时应该使用默认图标 📌', () => {
      const customData = {
        customCategories: [],
        customSubCategories: {
          '餐饮': [
            { id: 's1', label: '无图标小类' },  // 没有 icon 字段
          ],
        },
      };
      const result = mergeCategories(customData);
      const food = result.find((c) => c.label === '餐饮');
      const customSub = food.children.find((c) => c.label === '无图标小类');
      expect(customSub.icon).toBe('📌');
    });

    it('自定义一级分类的子类是字符串时应该正常处理', () => {
      const customData = {
        customCategories: [
          {
            id: 'cat-str',
            label: '测试分类',
            icon: '🧪',
            children: ['字符串子类1', '字符串子类2'],
          },
        ],
        customSubCategories: {},
      };
      const result = mergeCategories(customData);
      const testCat = result.find((c) => c.label === '测试分类');

      expect(testCat.children[0].label).toBe('字符串子类1');
      expect(testCat.children[0].icon).toBe('📌'); // 字符串子类默认图标
    });

    it('同时有自定义一级和二级分类时都应该正确合并', () => {
      const customData = {
        customCategories: [
          {
            id: 'custom-1',
            label: '新分类',
            icon: '✨',
            children: [{ id: 'cs1', label: '新子类', icon: '⭐' }],
          },
        ],
        customSubCategories: {
          '交通': [{ id: 'ts1', label: '共享单车', icon: '🚲' }],
        },
      };
      const result = mergeCategories(customData);

      // 11 预置 + 1 自定义一级 = 12
      expect(result.length).toBe(12);

      // 交通应该多了共享单车
      const traffic = result.find((c) => c.label === '交通');
      expect(traffic.children.length).toBe(7); // 原6 + 自定义1

      // 新分类应该在最后
      const newCat = result[result.length - 1];
      expect(newCat.label).toBe('新分类');
    });
  });

  describe('getCategoryIcon() 获取分类图标', () => {

    it('预置分类应该返回正确的图标', () => {
      expect(getCategoryIcon('餐饮')).toBe('🍜');
      expect(getCategoryIcon('交通')).toBe('🚗');
      expect(getCategoryIcon('购物')).toBe('🛒');
      expect(getCategoryIcon('住房')).toBe('🏠');
      expect(getCategoryIcon('娱乐')).toBe('🎮');
      expect(getCategoryIcon('医疗')).toBe('💊');
      expect(getCategoryIcon('教育')).toBe('📚');
      expect(getCategoryIcon('通讯')).toBe('📱');
      expect(getCategoryIcon('人情往来')).toBe('👥');
      expect(getCategoryIcon('金融理财')).toBe('💰');
      expect(getCategoryIcon('其他')).toBe('📦');
    });

    it('自定义分类应该从自定义列表中查找图标', () => {
      const customCats = [
        { id: 'c1', label: '宠物', icon: '🐱' },
        { id: 'c2', label: '运动', icon: '⚽' },
      ];
      expect(getCategoryIcon('宠物', customCats)).toBe('🐱');
      expect(getCategoryIcon('运动', customCats)).toBe('⚽');
    });

    it('找不到的分类应该返回默认图标 📦', () => {
      expect(getCategoryIcon('不存在的分类')).toBe('📦');
      expect(getCategoryIcon('')).toBe('📦');
    });
  });

  describe('getMainCategories() 获取一级分类列表', () => {

    it('应该返回正确数量的一级分类选项', () => {
      const result = getMainCategories();
      expect(result.length).toBe(presetCategories.length);
    });

    it('每个选项应该包含 value 和 label', () => {
      const result = getMainCategories();
      result.forEach((opt) => {
        expect(opt).toHaveProperty('value');
        expect(opt).toHaveProperty('label');
        // label 应该包含图标和名称
        expect(opt.label.length).toBeGreaterThan(1);
        expect(typeof opt.value).toBe('string');
        expect(opt.value.length).toBeGreaterThan(0);
      });
    });

    it('传入合并后的分类列表也能正常工作', () => {
      const merged = mergeCategories({});
      const result = getMainCategories(merged);
      expect(result.length).toBe(merged.length);
    });
  });

  describe('getSubCategories() 获取二级分类列表', () => {

    it('餐饮分类应该返回 6 个二级小类', () => {
      const result = getSubCategories('餐饮');
      expect(result.length).toBe(6);
    });

    it('每个二级分类应该包含 value 和 label（带图标）', () => {
      const result = getSubCategories('餐饮');
      result.forEach((sub) => {
        expect(sub).toHaveProperty('value');
        expect(sub).toHaveProperty('label');
        // label 应该包含图标和名称
        expect(sub.label.length).toBeGreaterThan(2);
        expect(typeof sub.value).toBe('string');
      });
    });

    it('不存在的分类应该返回空数组', () => {
      const result = getSubCategories('不存在的分类');
      expect(result).toEqual([]);
    });

    it('使用合并后的分类数据也能正常工作', () => {
      const merged = mergeCategories({});
      const result = getSubCategories('交通', merged);
      expect(result.length).toBe(6);
    });

    it('包含自定义二级小类的分类应该返回更多选项', () => {
      const customData = {
        customCategories: [],
        customSubCategories: {
          '餐饮': [{ id: 's1', label: '夜宵', icon: '🌙' }],
        },
      };
      const merged = mergeCategories(customData);
      const result = getSubCategories('餐饮', merged);
      // 原 6 + 自定义 1 = 7
      expect(result.length).toBe(7);
    });
  });
});
