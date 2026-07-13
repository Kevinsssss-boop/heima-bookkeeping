import { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import dayjs from 'dayjs';

const COLORS = [
  '#ff6b6b', '#4096ff', '#fa8c16', '#52c41a', '#9254de',
  '#eb2f96', '#13c2c2', '#d4a017', '#7cb305', '#597ef7', '#999',
];

/** 总览仪表盘：统计卡片 + 分类饼图 + 月度趋势 + 最近账单 */
function Dashboard({ expenses, monthlyBudget }) {
  const now = dayjs();
  const thisMonth = expenses.filter((e) => {
    const d = dayjs(e.date);
    return d.year() === now.year() && d.month() === now.month();
  });

  const total = thisMonth.reduce((s, e) => s + e.amount, 0);
  const daysInMonth = now.daysInMonth();
  const today = now.date();
  const dailyAvg = today > 0 ? total / today : 0;
  const budgetRemain = monthlyBudget > 0 ? monthlyBudget - total : 0;

  // 分类汇总 (饼图)
  const catMap = {};
  thisMonth.forEach((e) => {
    catMap[e.category1] = (catMap[e.category1] || 0) + e.amount;
  });
  const pieData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // 近6月趋势 (柱状图)
  const barData = [];
  for (let i = 5; i >= 0; i--) {
    const m = now.subtract(i, 'month');
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

  // 最近5条
  const recent = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="dashboard">
      {/* 统计卡片 */}
      <div className="dash-cards">
        <div className="dash-card">
          <div className="dash-card-label">本月支出</div>
          <div className="dash-card-value red">¥{total.toFixed(2)}</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-label">日均支出</div>
          <div className="dash-card-value">¥{dailyAvg.toFixed(2)}</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-label">记录笔数</div>
          <div className="dash-card-value">{thisMonth.length}</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-label">
            {monthlyBudget > 0 ? '预算剩余' : '月预算'}
          </div>
          <div className={`dash-card-value ${budgetRemain < 0 ? 'red' : 'green'}`}>
            {monthlyBudget > 0 ? `¥${budgetRemain.toFixed(2)}` : '未设置'}
          </div>
        </div>
      </div>

      {/* 图表区 */}
      <div className="dash-charts">
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

      {/* 最近记录 */}
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
