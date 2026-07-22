import {
  DashboardOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

const navItems = [
  { key: 'dashboard', label: '总览', icon: <DashboardOutlined /> },
  { key: 'expenses', label: '账单', icon: <UnorderedListOutlined /> },
  { key: 'stats', label: '统计', icon: <PieChartOutlined /> },
  { key: 'categories', label: '分类', icon: <AppstoreOutlined /> },
  { key: 'snake', label: '贪吃蛇', icon: <ExperimentOutlined /> },
];

function Sidebar({ activeView, onNavigate, onAdd, monthlyBudget, expenses }) {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🪙</span>
        <span className="sidebar-logo-text">K记</span>
      </div>

      {/* 记一笔 */}
      <button className="sidebar-add-btn" onClick={onAdd}>
        <PlusCircleOutlined style={{ fontSize: 18 }} />
        <span>记一笔</span>
      </button>

      {/* 导航 */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`sidebar-nav-item ${activeView === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* 底部信息 */}
      <div className="sidebar-footer">
        <div className="sidebar-budget">
          <div className="sidebar-budget-label">本月预算</div>
          <div className="sidebar-budget-value">
            ¥{monthlyBudget > 0 ? monthlyBudget.toLocaleString() : '未设置'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
