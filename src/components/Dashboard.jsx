/**
 * 总览仪表盘组件（首页默认视图）
 *
 * 展示内容（从上到下）：
 *   1. 统计卡片行：本月支出、日均支出、记录笔数、预算剩余/设置
 *   2. 图表区：
 *      - 左侧：分类占比饼图（本月各分类支出占比，按金额降序）
 *      - 右侧：近6月支出趋势柱状图
 *   3. 最近记录列表：最新 5 条支出记录摘要
 *
 * 计算逻辑：
 *   - "本月" = 当前年月匹配的记录
 *   - 总支出 = 本月所有记录的 amount 求和
 *   - 日均 = 总支出 / 今天是几号（避免除零错误）
 *   - 预算剩余 = 设定的预算 - 总支出（负数表示超支）
 */
import { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import dayjs from 'dayjs';

/**
 * 饼图通用的颜色配置（11 种分类各一个颜色）
 * 注意：此数组与 StatsView.jsx 中定义的 COLORS 完全相同
 * TODO: 后续可提取到 src/constants/chartColors.js 共享，消除重复
 */
const COLORS = [
  '#ff6b6b', // 🍜 餐饮 - 红色
  '#409ff', // 🚗 交通 - 蓝色
  '#fa8c16', // 🛒 购物 - 橙色
  '#52c41a', // 🏠 住房 - 绿色
  '#9254de', // 🎮 娱乐 - 紫色
  '#eb2f96', // 💊 医色 - 粉色
  '#13c2c2', // 📚 教育 - 青色
  '#d4a017', // 📱 通讯 - 金色
  '#7cb305', // 👥 人情往来 - 橄绿色
  '#597ef7', // 💰 金融理财 - 靛蓝色
  '#999',    // 📦 其他 - 灰色
];

/**
 * 总览仪表盘组件
 *
 * @param {Array} expenses - 所有支出记录（由 App.jsx 传入）
 * @param {number} monthlyBudget - 用户设置的月度预算（0 表示未设置）
 */
function Dashboard({ expenses, monthlyBudget }) {
  const now = dayjs();

  /** 筛选出"本月"（当前年月）的所有支出记录 */
  const thisMonth = expenses.filter((e) => {
    const d = dayjs(e.date);
    return d.year() === now.year() && d.month() === now.month();
  });

  /** 本月总支出 = 所有本月记录的金额求和 */
  const total = thisMonth.reduce((s, e) => s + e.amount, 0);

  /** 本月已过天数 + 1（用于计算日均，避免除以 0） */
  const daysInMonth = now.daysInMonth();
  const today = now.date();
  /** 日均支出 = 总支出 / 今天几号（今天还没过完则按已过天数算） */
  const dailyAvg = today > 0 ? total / today : 0;

  /**
   * 预算剩余 = 预算设定值 - 已支出总额
   * 正数：还有剩余；负数：已超支；0：未设置预算
   */
  const budgetRemain = monthlyBudget > 0 ? monthlyBudget - total : 0;

  // ====== 分类汇总（用于饼图） ======

  /**
   * 按"一级分类"分组统计每个分类的本月总支出
   * 返回格式：[{ name: '餐饮', value: 35.5 }, ...]
   * 按金额降序排列（花最多的排前面）
   */
  const catMap = {};
  thisMonth.forEach((e) => {
    catMap[e.category1] = (catMap[e.category1] || 0) + e.amount;
  });
  const pieData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // ====== 近 6 月趋势数据（用于柱状图）=====

  /**
   * 从当前月份往前推 6 个月，计算每个月的总支出
   * 返回格式：[{ month: '7月', 支出: 350 }, ...]
   */
  const barData = [];
  for (let i = 5; i >= 0; i--) {
    const m = now.subtract(i, 'month');
    // 筛选出该月的所有记录并求和
    const monthTotal = expenses
      .filter((e) => {
        const d = dayjs(e.date);
        return d.year() === m.year() && d.month() === m.month();
      })
      .reduce((s, e) => s + e.amount, 0);
    barData.push({
      month: m.format('M月'),
      支出: Math.round(monthTotal * 100) / 100,
    });
  }

  // ====== 最近 5 条记录（用于底部快速预览）=====

  /** 按日期倒序排列，取最新的 5 条 */
  const recent = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="dashboard">
      {/* ===== 第一行：4 个统计卡片 ===== */}
      <div className="dash-cards">
        {/* 卡片1：本月总支出 */}
        <div className="dash-card">
          <div className="dash-card-label">本月支出</div>
          <div className="dash-card-value red">¥{total.toFixed(2)}</div>
        </div>
        {/* 卡片2：日均支出 */}
        <div className="dash-card">
          <div className="dash-card-label">日均支出</div>
          <div className="dash-card-value">¥{dailyAvg.toFixed(2)}</div>
        </div>
        {/* 卡片3：本月记录笔数 */}
        <div className="dash-card">
          <div className="dash-card-label">记录笔数</div>
          <div className="dash-card-value">{thisMonth.length}</div>
        </div>
        {/* 卡片4：预算剩余 / 设置入口 */}
        <div className="dash-card">
          <div className="dash-card-label">
            {monthlyBudget > 0 ? '预算剩余' : '月预算'}
          </div>
          <div className={`dash-card-value ${budgetRemain < 0 ? 'red' : 'green'}`}>
            {monthlyBudget > 0 ? `¥${budgetRemain.toFixed(2)}` : '未设置'}
          </div>
        </div>
      </div>

      {/* ===== 第二行：图表区（饼图 + 柱状图） ===== */}
      <div className="dash-charts">
        {/* 左侧：本月分类占比饼图 */}
        <div className="dash-chart-box">
          <h3>📊 本月分类占比</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `¥${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-empty">本月暂无数据</div>
          )}
        </div>

        {/* 右侧：近 6 月支出趋势柱状图 */}
        <div className="dash-chart-box">
          <h3>📈 近6月趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `¥${v.toFixed(2)}`} />
              <Bar dataKey="支出" fill="#4096ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 第三行：最近 5 条记录快速预览 */}
      <div className="dash-recent">
        <h3>🕐 最近记录</h3>
        {recent.map((item) => (
          <div key={item.id} className="dash-recent-item">
            <span className="dash-recent-cat">{item.category1} · {item.category2}</span>
            <span className="dash-recent-date">{item.date}</span>
            <span className="dash-recent-amount">-¥{item.amount.toFixed(2)}</span>
          </div>
        ))}
        {recent.length === 0 && (
          <div className="dash-empty">还没有记录，点击左侧"记一笔"开始吧</div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
