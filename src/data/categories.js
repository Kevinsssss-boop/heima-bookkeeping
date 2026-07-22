/**
 * 预置支出分类数据（不可被用户修改）
 * 二级分类体系：一级大类 → 二级小类
 * 每个一级分类包含 label（名称）、icon（图标）、children（小类列表）
 */

export const presetCategories = [
  {
    label: '餐饮',
    icon: '🍜',
    children: ['早餐', '午餐', '晚餐', '零食小吃', '饮品咖啡', '朋友聚餐'],
  },
  {
    label: '交通',
    icon: '🚗',
    children: ['公交/地铁', '出租车/网约车', '加油充电', '停车费', '火车/高铁', '飞机机票'],
  },
  {
    label: '购物',
    icon: '🛒',
    children: ['日用百货', '服装鞋帽', '数码产品', '家居用品', '个护美妆'],
  },
  {
    label: '住房',
    icon: '🏠',
    children: ['房租', '水费', '电费', '燃气费', '物业费', '维修保养'],
  },
  {
    label: '娱乐',
    icon: '🎮',
    children: ['电影演出', '游戏充值', '音乐/视频会员', '旅游出行', '运动健身'],
  },
  {
    label: '医疗',
    icon: '💊',
    children: ['门诊挂号', '药品购买', '住院治疗', '体检检查'],
  },
  {
    label: '教育',
    icon: '📚',
    children: ['课程/培训', '书籍购买', '文具用品', '考试报名'],
  },
  {
    label: '通讯',
    icon: '📱',
    children: ['手机话费', '宽带网费', '快递邮寄'],
  },
  {
    label: '人情往来',
    icon: '👥',
    children: ['红包/礼金', '请客吃饭', '节日礼物'],
  },
  {
    label: '金融理财',
    icon: '💰',
    children: ['保险支出', '投资亏损', '银行手续费'],
  },
  {
    label: '其他',
    icon: '📦',
    children: ['其他支出'],
  },
];

// 默认导出保持向后兼容（预置分类）
export default presetCategories;

/** 预置二级分类 → 图标映射 */
export const presetSubIcons = {
  // 餐饮
  '早餐': '🌅', '午餐': '☀️', '晚餐': '🌙', '零食小吃': '🍿', '饮品咖啡': '☕', '朋友聚餐': '🍻',
  // 交通
  '公交/地铁': '🚌', '出租车/网约车': '🚕', '加油充电': '⛽', '停车费': '🅿️', '火车/高铁': '🚄', '飞机机票': '✈️',
  // 购物
  '日用百货': '🧴', '服装鞋帽': '👔', '数码产品': '📱', '家居用品': '🛋️', '个护美妆': '💄',
  // 住房
  '房租': '🏠', '水费': '💧', '电费': '⚡', '燃气费': '🔥', '物业费': '🏢', '维修保养': '🔧',
  // 娱乐
  '电影演出': '🎬', '游戏充值': '🎮', '音乐/视频会员': '🎵', '旅游出行': '🧳', '运动健身': '🏋️',
  // 医疗
  '门诊挂号': '🏥', '药品购买': '💊', '住院治疗': '🛌', '体检检查': '🩺',
  // 教育
  '课程/培训': '📚', '书籍购买': '📖', '文具用品': '✏️', '考试报名': '📝',
  // 通讯
  '手机话费': '📞', '宽带网费': '📶', '快递邮寄': '📦',
  // 人情往来
  '红包/礼金': '🧧', '请客吃饭': '🍽️', '节日礼物': '🎁',
  // 金融理财
  '保险支出': '🛡️', '投资亏损': '📉', '银行手续费': '🏦',
  // 其他
  '其他支出': '📌',
};

/**
 * 合并预置分类和自定义分类，返回完整分类列表
 * @param {Object} customData - { customCategories, customSubCategories }
 * @returns {Array} 合并后的完整分类列表
 */
export function mergeCategories(customData) {
  const { customCategories = [], customSubCategories = {} } = customData || {};

  // 1. 预置分类 + 用户添加的二级分类
  const merged = presetCategories.map((cat) => {
    const extraSubs = (customSubCategories[cat.label] || []).map((s) => ({
      label: s.label,
      icon: s.icon || '📌',
    }));
    return {
      ...cat,
      children: [
        ...cat.children.map((s) => ({ label: s, icon: presetSubIcons[s] || '📌' })),
        ...extraSubs,
      ],
      isPreset: true,
    };
  });

  // 2. 追加用户自定义的一级分类
  customCategories.forEach((cat) => {
    merged.push({
      label: cat.label,
      icon: cat.icon,
      children: (cat.children || []).map((s) => ({
        label: typeof s === 'string' ? s : s.label,
        icon: typeof s === 'string' ? '📌' : (s.icon || '📌'),
      })),
      isPreset: false,
      customId: cat.id,
    });
  });

  return merged;
}

/**
 * 根据一级分类名称获取其图标（支持自定义分类）
 * @param {string} category1Label 一级分类名
 * @param {Array} customCategories 自定义一级分类列表
 * @returns {string} emoji 图标
 */
export function getCategoryIcon(category1Label, customCategories = []) {
  // 先查预置
  const preset = presetCategories.find((c) => c.label === category1Label);
  if (preset) return preset.icon;
  // 再查自定义
  const custom = customCategories.find((c) => c.label === category1Label);
  return custom ? custom.icon : '📦';
}

/**
 * 获取所有一级分类的 label 列表（用于 Select 组件）
 */
export function getMainCategories(mergedCategories) {
  return (mergedCategories || presetCategories).map((c) => ({
    value: c.label,
    label: `${c.icon} ${c.label}`,
  }));
}

/**
 * 根据一级分类 label 获取二级分类列表（用于 Select 组件）
 * @param {string} mainCategoryLabel 一级分类名
 * @param {Array} mergedCategories 完整分类列表（含自定义）
 */
export function getSubCategories(mainCategoryLabel, mergedCategories) {
  const cats = mergedCategories || presetCategories;
  const cat = cats.find((c) => c.label === mainCategoryLabel);
  if (!cat) return [];
  return cat.children.map((child) => {
    const label = typeof child === 'string' ? child : child.label;
    const icon = typeof child === 'string'
      ? (presetSubIcons[child] || '📌')
      : (child.icon || '📌');
    return { value: label, label: `${icon}  ${label}` };
  });
}
