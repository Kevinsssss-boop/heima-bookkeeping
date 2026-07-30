/**
 * 支出记录列表组件
 *
 * 功能：
 *   1. 展示所有支出记录（按时间倒序，最新的在前面）
 *   2. 支持按一级分类筛选（如只看餐饮相关的）
 *   3. 支持按月份筛选（如只看 7 月的）
 *   4. 点击记录行可进入编辑模式
 *   5. 点击删除按钮可删除记录（有二次确认弹窗）
 *
 * 空状态处理：
 *   - 加载中：显示"加载中..."
 *   - 无数据：显示空状态提示 + 引导用户开始记账
 *   - 筛选无结果：显示"没有匹配的记录"
 */
import { useState, useMemo } from 'react';
import { Popconfirm, Select, DatePicker } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { getCategoryIcon } from '../data/categories';
import dayjs from 'dayjs';

/**
 * 分类名称 → 背景色映射表
 * 用于给每个分类的图标圆点配上对应的背景色
 * 设计意图：让不同分类在视觉上容易区分
 */
const CATEGORY_BG_COLORS = {
  '餐饮': '#fff2f0', '交通': '#e6f7ff', '购物': '#fff7e6',
  '住房': '#f6ffed', '娱乐': '#f9f0ff', '医疗': '#fff0f6',
  '教育': '#e6fffb', '通讯': '#fffbe6', '人情往来': '#fcffe6',
  '金融理财': '#f0f5ff', '其他': '#fafafa',
};

/**
 * 分类名称 → 文字色映射表
 * 用于分类文字的颜色，与背景色搭配确保对比度足够
 */
const CATEGORY_FG_COLORS = {
  '餐饮': '#ff6b6b', '交通': '#4096ff', '购物': '#fa8c16',
  '住房': '#52c41a', '娱乐': '#9254de', '医疗': '#eb2f96',
  '教育': '#13c2c2', '通讯': '#d4a017', '人情往来': '#7cb305',
  '金融理财': '#597ef7', '其他': '#999',
};

/**
 * 根据分类名获取对应的背景色
 * @param {string} cat - 一级分类名称（如 "餐饮"）
 * @returns {string} 十六进制颜色值，未找到则返回默认灰色
 */
function getCategoryBgColor(cat) {
  return CATEGORY_BG_COLORS[cat] || '#fafafa';
}

/**
 * 根据分类名获取对应的文字色
 * @param {string} cat - 一级分类名称（如 "餐饮"）
 * @returns {string} 十六进制颜色值，未找到则返回灰色
 */
function getCategoryFgColor(cat) {
  return CATEGORY_FG_COLORS[cat] || '#999';
}

/**
 * 支出列表主组件
 * @param {Array} expenses - 所有支出记录
 * @param {boolean} loading - 是否正在加载
 * @param {Function} onEdit - 点击记录行时的回调（传入该条记录对象）
 * @param {Function} onDelete - 确认删除时的回调（传入被删记录的 ID）
 * @param {Object} customData - 自定义分类数据（用于获取自定义分类的图标）
 */
function ExpenseList({ expenses, loading, onEdit, onDelete, customData }) {
  /** 当前筛选的一级分类（null 表示不筛选） */
  const [filterCategory, setFilterCategory] = useState(null);
  /** 当前筛选的月份（null 表示不按月筛选） */
  const [filterMonth, setFilterMonth] = useState(null);

  /**
   * 根据当前筛选条件，过滤出要显示的记录
   * 支持三种筛选方式：全不筛 / 按分类筛 / 按月份筛 / 组合筛选
   */
  const filtered = useMemo(() => {
    let list = [...expenses]; // 浅拷贝，避免修改原数组
    if (filterCategory) {
      list = list.filter((e) => e.category1 === filterCategory);
    }
    if (filterMonth) {
      list = list.filter((e) => dayjs(e.date).format('YYYY-MM') === filterMonth.format('YYYY-MM'));
    }
    return list;
  }, [expenses, filterCategory, filterMonth]);

  /**
   * 从所有记录中提取去重后的一级分类列表
   * 用于生成分类筛选下拉框的选项（带图标）
   */
  const catOptions = [...new Set(expenses.map((e) => e.category1))].map((c) => ({
    value: c,
    label: `${getCategoryIcon(c, customData?.customCategories)} ${c}`,
  }));

  // ====== 空状态和加载态 ======

  // 数据还在加载中
  if (loading) {
    return <div className="expense-empty"><div className="empty-text">加载中...</div></div>;
  }

  // 加载完成但没有记录
  if (expenses.length === 0) {
    return (
      <div className="expense-empty">
        <div className="empty-icon">📒</div>
        <div className="empty-text">还没有记录</div>
        <div style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>
          点击左侧 "记一笔" 开始记账吧
        </div>
      </div>
    );
  }

  // ====== 主内容区 ======
  return (
    <div>
      {/* 筛选工具栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select
          placeholder="全部分类"
          allowClear
          value={filterCategory}
          onChange={setFilterCategory}
          options={catOptions}
          style={{ width: 180 }}
        />
        <DatePicker
          picker="month"
          placeholder="全部月份"
          allowClear
          value={filterMonth}
          onChange={setFilterMonth}
          style={{ width: 160 }}
          maxDate={dayjs()}
        />
        <span style={{ color: '#999', fontSize: 13, alignSelf: 'center' }}>
          共 {filtered.length} 条
        </span>
      </div>

      {/* 记录列表表格（有数据时才渲染） */}
      {filtered.length > 0 ? (
        <div className="expense-list-desktop">
          {/* 表头：分类 | 子分类 | 日期 | 备注 | 金额 */}
          <div className="expense-list-header">
            <span>分类</span>
            <span>子分类</span>
            <span>日期</span>
            <span>备注</span>
            <span style={{ textAlign: 'left', display: 'block' }}>金额</span>
          </div>
          {/* 逐行渲染每条记录 */}
          {filtered.map((item) => (
            <div
              key={item.id}
              className="expense-row"
              onClick={() => onEdit(item)}  /* 点击整行进入编辑 */
            >
              {/* 分类列：图标 + 名称 */}
              <div className="col-category">
                <span
                  className="col-icon"
                  style={{
                    background: getCategoryBgColor(item.category1),
                    color: getCategoryFgColor(item.category1),
                  }}
                >
                  {getCategoryIcon(item.category1, customData?.customCategories)}
                </span>
                {item.category1}
              </div>
              {/* 子分类列 */}
              <div className="col-sub">{item.category2}</div>
              {/* 日期列 */}
              <div className="col-date">{item.date}</div>
              {/* 备注列：无备注时显示 "-" */}
              <div className="col-note">{item.note || '-'}</div>
              {/* 金额列：红色负号 + 两位小数 */}
              <div className="col-amount">
                <span className="col-amount-text">-¥{item.amount.toFixed(2)}</span>
                {/* 删除按钮：点击弹出二次确认弹窗 */}
                <Popconfirm
                  title="确定删除？"
                  onConfirm={(e) => {
                    e?.stopPropagation();  // 阻止事件冒泡到行点击
                    onDelete(item.id);                   // 确认后执行删除
                  }}
                  onCancel={(e) => e?.stopPropagation()}  // 取消也阻止冒泡
                  okText="删除"
                  cancelText="取消"
                >
                  <DeleteOutlined
                    className="col-delete"
                    onClick={(e) => e.stopPropagation()}  // 防止冒泡
                  />
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 筛选后有结果但为空 */
        <div className="expense-empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">没有匹配的记录</div>
        </div>
      )}
    </div>
  );
}

export default ExpenseList;
