import { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import dayjs from 'dayjs';

const COLORS = [
  '#ff6b6b', '#4096ff', '#fa8c16', '#52c41a', '#9254de',
  '#eb2f96', '#13c2c2', '#d4a017', '#7cb305', '#597ef7', '#999',
];

/** 统计分析：年度趋势 + 分类对比 + 排行榜 */
function StatsView({ expenses, monthlyBudget }) {
  const now = dayjs();
  const [year, setYear] = useState(now.year());

  const yearExpenses = expenses.filter((e) => dayjs(e.date).year() === year);
  const yearTotal = yearExpenses.reduce((s, e) => s + e.amount, 0);

  // 全年月度趋势
  const monthlyData = [];
  for (let m = 0; m < 12; m++) {
    const monthTotal = yearExpenses
      .filter((e) => dayjs(e.date).month() === m)
      .reduce((s, e) => s + e.amount, 0);
    monthlyData.push({
      month: `${m + 1}月`,
      支出: Math.round(monthTotal * 100) / 100,
      ...(monthlyBudget > 0 ? { 预算: monthlyBudget } : {}),
    });
  }

  // 分类排行
  const catMap = {};
  yearExpenses.forEach((e) => {
    catMap[e.category1] = (catMap[e.category1] || 0) + e.amount;
  });
  const catRank = Object.entries(catMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const catPieData = catRank;

  // 今年可选的年份
  const years = [...new Set(expenses.map((e) => dayjs(e.date).year()))].sort(
    (a, b) => b - a
  );
  if (!years.includes(now.year())) years.unshift(now.year());

  return (
    <div className="stats-view">
      {/* 顶部摘要 */}
      <div className="stats-summary">
        <div className="stats-summary-left">
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

      {/* 图表区 */}
      <div className="stats-charts">
        <div className="stats-chart-box large">
          <h3>📈 {year}年月度支出趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="支出" fill="#4096ff" radius={[6, 6, 0, 0]} />
              {monthlyBudget > 0 && (
                <Bar dataKey="预算" fill="#ffa940" radius={[6, 6, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

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
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-empty">暂无数据</div>
          )}
        </div>
      </div>

      {/* 分类排行榜 */}
      <div className="stats-rank">
        <h3>🏆 支出排行榜</h3>
        <div className="rank-list">
          {catRank.map((item, idx) => (
            <div key={item.name} className="rank-item">
              <span className="rank-num">{idx + 1}</span>
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
  );
}

export default StatsView;
