/**
 * 生成唯一 ID
 * 优先使用 crypto.randomUUID()，不支持时回退到手动生成
 */
export function generateId() {
  // crypto.randomUUID() 在现代浏览器中都支持
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 手动回退方案（兼容非常旧的浏览器）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
