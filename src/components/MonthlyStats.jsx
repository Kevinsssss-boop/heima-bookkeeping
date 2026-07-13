import dayjs from 'dayjs';

/**
 * 月度统计卡片
 * 显示本月支出总额、日均支出、记录笔数
 */
function MonthlyStats({ expenses }) {
  const now = dayjs();
  const daysInMonth = now.daysInMonth();
  const today = now.date();

  // 本月记录
  const thisMonthExpenses = expenses.filter((item) => {
    const d = dayjs(item.date);
    return d.year() === now.year() && d.month() === now.month();
  });

  const total = thisMonthExpenses.reduce((s, i) => s + i.amount, 0);
  const count = thisMonthExpenses.length;
  const dailyAvg = today > 0 ? total / today : 0;

  // 本月最大的几笔支出分类
  const categoryTotals = {};
  thisMonthExpenses.forEach((item) => {
    categoryTotals[item.category1] = (categoryTotals[item.category1] || 0) + item.amount;
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="stats-card">
      <div className="stats-item">
        <div className="stats-label">本月支出</div>
        <div className="stats-value danger">
          <small>¥</small>{total.toFixed(0)}
        </div>
      </div>
      <div className="stats-divider" />
      <div className="stats-item">
        <div className="stats-label">日均</div>
        <div className="stats-value">
          <small>¥</small>{dailyAvg.toFixed(0)}
        </div>
      </div>
      <div className="stats-divider" />
      <div className="stats-item">
        <div className="stats-label">笔数</div>
        <div className="stats-value">{count}</div>
      </div>
    </div>
  );
}

export default MonthlyStats;
