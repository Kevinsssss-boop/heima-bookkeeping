import { describe, it, expect, vi } from 'vitest';
import { generateId } from './helpers';

describe('工具函数 helpers.js', () => {

  describe('generateId() 生成唯一 ID', () => {

    it('应该返回符合 UUID v4 格式的字符串', () => {
      const id = generateId();
      // UUID v4 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('每次调用应该返回不同的值', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('连续生成 100 个 ID 都不重复', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it('生成的 ID 长度应该是 36 个字符（含连字符）', () => {
      const id = generateId();
      expect(id.length).toBe(36);
    });

  });
});
