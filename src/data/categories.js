/**
 * 支出分类数据
 * 二级分类体系：一级大类 → 二级小类
 * 每个一级分类包含 label（名称）、icon（图标）、children（小类列表）
 */

const categories = [
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

export default categories;

/**
 * 根据一级分类名称获取其图标
 */
export function getCategoryIcon(category1Label) {
  const cat = categories.find((c) => c.label === category1Label);
  return cat ? cat.icon : '📦';
}

/**
 * 获取所有一级分类的 label 列表（用于 Select 组件）
 */
export function getMainCategories() {
  return categories.map((c) => ({
    value: c.label,
    label: `${c.icon} ${c.label}`,
  }));
}

/**
 * 根据一级分类 label 获取二级分类列表（用于 Select 组件）
 */
export function getSubCategories(mainCategoryLabel) {
  const cat = categories.find((c) => c.label === mainCategoryLabel);
  if (!cat) return [];
  return cat.children.map((child) => ({
    value: child,
    label: child,
  }));
}
