/**
 * 统计分析视图（年度维度）
 *
 * 展示内容（从上到下）：
 *   1. 年份选择器 + 年度总支出摘要
 *   2. 月度支出趋势柱状图（12 个月）
 *   3. 分类占比饼图
 *   4. 分类支出排行榜（按金额降序）
 *
 * 与 Dashboard（月度视图）的区别：
 *   - Dashboard 看的是"本月"的数据
 *   - StatsView 看的是"整年"的数据，支持切换年份
 */
import { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import dayjs from 'dayjs';

/**
 * 饼图通用颜色配置（11 种分类各一个颜色）
 * 注意：此数组与 Dashboard.jsx 中定义的 COLORS 完全相同
 * TODO: 后续可提取到 src/constants/chartColors.js 共享，消除重复
 */
const COLORS = [
  '#ff6b6b', // 🍜 餐饮
  '#409ff', // 🚗 交通
  '#fa8c16', // 🛒 购物
  '#    ', // 🏠 住房 (已移除，见下方说明)
  '#9254de', // 🎮 娱乐
  '#eb2f96', // 💊 医疗
  '#13c2c2', // 📚 教育
  '#d4a017', // 📱 通讯
  '#7cb305', // 👥 人情往来
  '#597ef7', // 💰 金融理财
  '#999',    // 📦 其他
];

/** 住房分类颜色（Dashboard 用 #52c41a，这里保持一致） */
const HOUSING_COLOR = '#52c41a';

/**
 * 统计分析组件
 *
 * @param {Array} expenses - 所有支出记录
 * @param {number} monthlyBudget - 月度预算设置
 */
function StatsView({ expenses, monthlyBudget }) {
  const now = dayjs();

  /** 当前选中的统计年份（默认今年） */
  const [year, setYear] = useState(now.year());

  /** 筛选出"本年"的所有支出记录 */
  const yearExpenses = expenses.filter((e) => dayjs(e.date).year() === year);

  /** 本年总支出 */
  const yearTotal = yearExpenses.reduce((s, e) => s + e.amount, 0);

  /**
   * 计算全年 12 个月每个月的支出总额
   * 返回格式：[{ month: '1月', 支出: 350 }, { month: '2月', 支出: 200 }, ...]
   * 如果用户设置了预算，每个月还会附带预算值用于对比
   */
  const monthlyData = [];
  for (let m = 0; m < 12; m++) {
    const monthTotal = yearExpenses
      .filter((e) => dayjs(e.date).month() === m)
      .reduce((s, e) => s + e.amount, 0);
    monthlyData.push({
      month: `${m + 1}月`,
      支出: Math.round(monthTotal * 100) / 100,
      ...(monthlyBudget > 0 ? { 预算: monthlyBudget } : {}),  // 有预算时附加预算列
    });
  }

  /**
   * 按"一级分类"汇总全年支出，用于饼图和排行榜
   * 返回格式：[{ name: '餐饮', value: 3500 }, ...] 按金额降序
   */
  const catMap = {};
  yearExpenses.forEach((e) => {
    catMap[e.category1] = (catMap[e.category1] || 0) + e.amount;
  });
  const catRank = Object.entries(catMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  /** 饼图数据直接复用排行数据（结构一样：{ name, value }） */
  const catPieData = catRank;

  /**
   * 从所有记录中提取出有数据的年份列表（去重 + 排序）
   * 用于生成年份选择器的选项
   * 始终包含当前年份（即使该年没有数据也显示出来）
   */
  const years = [...new Set(expenses.map((e) => dayjs(e.date).year()))].sort(
    (a, b) => b - a
  );
  if (!years.includes(now.year())) years.unshift(now.year());

  return (
    <div className="stats-view">
      {/* ===== 顶部：年份选择器 + 年度总支出摘要 ===== */}
      <div className="stats-summary">
        <div className="stats-summary-left">
          {/* 年份下拉选择器 */}
          <select
            className="year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y} 年</option>
            ))}
          </select>
          <span className="year-total">年度支出 ¥{yearTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* ===== 图表区（左趋势 + 右饼图 + 下排行榜）===== */}
      <div className="stats-charts">
        {/* 左侧：月度支出趋势柱状图（双系列：实际支出 + 预算对比） */}
        <div className="stats-chart-box large">
          <h3>📈 {year}年月度支出趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="支出" fill="#409ff" radius={[6, 6, 0, 0]} />
              {/* 如果设置了预算，额外渲染一列预算参考线 */}
              {monthlyBudget > 0 && (
                <Bar dataKey="预算" fill={HOUSING_COLOR} radius={[6, 6, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 右侧：分类占比饼图 */}
        <div className="stats-chart-box">
          <h3>🎯 分类占比</h3>
          {catPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={catPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {catPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />}
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>

        {/* 底部：分类支出排行榜（金额从高到低） */}
        <div className="stats-rank">
          <h3>🏆 支出排行榜</h3>
          <div className="rank-list">
            {catRank.map((item, idx) => (
              <div key={item.name} className="rank-item">
                <span className="rank-num">{idx + 1}</span>
                {/* 进度条：宽度百分比 = 该分类支出 / 第一名支出的比例 × 100% */}
                <span
                  className="rank-bar"
                  style={{
                    width: `${(item.value / (catRank[0]?.value || 1)) * 100}%`,
                    background: COLORS[idx % COLORS.length],
                  }}
                />
                <span className="rank-label">{item.name}</span>
                <span className="rank-value">¥{item.value.toFixed(2)}</span>
              </div>
            ))}
            {catRank.length === 0 && (
              <div className="dash-empty">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsView;
