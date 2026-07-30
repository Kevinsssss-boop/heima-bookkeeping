import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock recharts（避免 canvas 渲染问题）
vi.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: ({ fill }) => <div data-testid="cell" style={{ backgroundColor: fill }} />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: (props) => <div data-testid="bar" {...props} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Legend: (props) => <div data-testid="legend" {...props} />,
}));

describe('Dashboard 总览仪表盘组件', () => {

  const defaultProps = {
    expenses: [],
    monthlyBudget: 3000,
  };

  // 获取统计卡片区域的辅助函数
  const getCards = (container) => container.querySelectorAll('.dash-card');

  it('应该渲染仪表盘容器', () => {
    const { container } = render(<Dashboard {...defaultProps} />);
    expect(container.querySelector('.dashboard')).toBeInTheDocument();
  });

  describe('统计卡片', () => {

    it('无数据时本月支出应为 ¥0.00', () => {
      const { container } = render(<Dashboard {...defaultProps} />);
      const cards = getCards(container);
      // 第一个卡片是"本月支出"
      expect(within(cards[0]).getByText('¥0.00')).toBeInTheDocument();
    });

    it('无数据时日均支出应为 ¥0.00', () => {
      const { container } = render(<Dashboard {...defaultProps} />);
      const cards = getCards(container);
      // 第二个卡片是"日均支出"
      expect(within(cards[1]).getByText('¥0.00')).toBeInTheDocument();
    });

    it('无数据时记录笔数应为 0', () => {
      const { container } = render(<Dashboard {...defaultProps} />);
      const cards = getCards(container);
      // 第三个卡片是"记录笔数"
      expect(within(cards[2]).getByText('0')).toBeInTheDocument();
    });

    it('设置了预算时应显示预算剩余', () => {
      const { container } = render(<Dashboard {...defaultProps} monthlyBudget={5000} />);
      const cards = getCards(container);
      // 第四个卡片是预算相关
      expect(within(cards[3]).getByText(/预算剩余/)).toBeInTheDocument();
      expect(within(cards[3]).getByText('¥5000.00')).toBeInTheDocument();
    });

    it('未设置预算时应显示"未设置"', () => {
      const { container } = render(<Dashboard {...defaultProps} monthlyBudget={0} />);
      const cards = getCards(container);
      expect(within(cards[3]).getByText('月预算')).toBeInTheDocument();
      expect(within(cards[3]).getByText('未设置')).toBeInTheDocument();
    });
  });

  describe('有支出数据时的计算', () => {

    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthExpenses = [
      { id: 'd1', amount: 100, category1: '餐饮', category2: '午餐', date: todayStr, note: '' },
      { id: 'd2', amount: 200, category1: '交通', category2: '打车', date: todayStr, note: '' },
      { id: 'd3', amount: 300, category1: '购物', category2: '日用品', date: todayStr, note: '' },
    ];

    it('本月支出应该是所有本月记录的总和', () => {
      const { container } = render(<Dashboard {...defaultProps} expenses={thisMonthExpenses} />);
      const cards = getCards(container);
      // 100 + 200 + 300 = 600
      expect(within(cards[0]).getByText('¥600.00')).toBeInTheDocument();
    });

    it('记录笔数应该正确', () => {
      const { container } = render(<Dashboard {...defaultProps} expenses={thisMonthExpenses} />);
      const cards = getCards(container);
      expect(within(cards[2]).getByText('3')).toBeInTheDocument(); // 3 笔记录
    });

    it('超支时预算剩余应显示负数', () => {
      // 总支出 600，预算只有 400 → 超支
      const { container } = render(<Dashboard {...defaultProps} expenses={thisMonthExpenses} monthlyBudget={400} />);
      const cards = getCards(container);
      // 预算剩余 = 400 - 600 = -200
      expect(within(cards[3]).getByText('¥-200.00')).toBeInTheDocument();
    });
  });

  describe('图表区域', () => {

    it('本月有数据时应渲染饼图', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const expenses = [
        { id: 'p1', amount: 100, category1: '餐饮', category2: '午餐', date: todayStr, note: '' },
      ];
      const { container } = render(<Dashboard {...defaultProps} expenses={expenses} />);
      expect(container.querySelector('.dash-chart-box')).toBeInTheDocument();
      expect(screen.getByText('📊 本月分类占比')).toBeInTheDocument();
    });

    it('本月无数据时应显示暂无数据提示', () => {
      // 上个月的数据，不是本月
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const expenses = [
        { id: 'p1', amount: 100, category1: '餐饮', category2: '午餐', date: lastMonth.toISOString().split('T')[0], note: '' },
      ];
      render(<Dashboard {...defaultProps} expenses={expenses} />);
      expect(screen.getByText('本月暂无数据')).toBeInTheDocument();
    });

    it('应该渲染近6月趋势图', () => {
      render(<Dashboard {...defaultProps} />);
      expect(screen.getByText('📈 近6月趋势')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('最近记录', () => {

    it('无数据时应显示提示文字', () => {
      render(<Dashboard {...defaultProps} />);
      expect(screen.getByText('🕐 最近记录')).toBeInTheDocument();
      expect(screen.getByText(/还没有记录/)).toBeInTheDocument();
    });

    it('有数据时应显示最近记录列表', () => {
      const baseDate = new Date();
      const expenses = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        return {
          id: `r${i}`,
          amount: 10 * (i + 1),
          category1: '餐饮',
          category2: '午餐',
          date: d.toISOString().split('T')[0],
          note: `备注${i}`,
        };
      });
      const { container } = render(<Dashboard {...defaultProps} expenses={expenses} />);

      // 最近记录区域应该存在
      const recentArea = container.querySelector('.dash-recent');
      expect(recentArea).toBeInTheDocument();

      // 应该有最近记录项（最多5条）
      const recentItems = container.querySelectorAll('.dash-recent-item');
      expect(recentItems.length).toBe(5);
    });
  });
});
