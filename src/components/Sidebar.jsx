/**
 * 侧边栏导航组件
 *
 * 功能：
 *   1. 显示 K记 Logo 和应用名称
 *   2. "记一笔"快捷入口按钮（打开记账弹窗）
 *   3. 导航菜单：总览、账单、统计、分类管理、贪吃蛇
 *   4. 底部显示当前月预算余额
 *
 * 布局：固定在左侧，宽度约 200px
 *
 * @param {string} activeView - 当前激活的视图名称（用于高亮对应导航项）
 * @param {Function} onNavigate - 切换视图时的回调
 * @param {Function} onAdd - 点击"记一笔"按钮的回调
 * @param {number} monthlyBudget - 当前设置的月度预算
 */
import {
  DashboardOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

/**
 * 导航项配置：每个视图对应的图标和标签
 * key 用于匹配 activeView，决定哪个项高亮为"活跃"状态
 */
const navItems = [
  { key: 'dashboard', label: '总览', icon: <DashboardOutlined /> },
  { key: 'expenses', label: '账单', icon: <UnorderedListOutlined /> },
  { key: 'stats', label: '统计', icon: <PieChartOutlined /> },
  { key: 'categories', label: '分类', icon: <AppstoreOutlined /> },
  { key: 'snake', label: '贪吃蛇', icon: <ExperimentOutlined /> },
];

function Sidebar({ activeView, onNavigate, onAdd, monthlyBudget }) {
  return (
    <div className="sidebar">
      {/* ===== 应用 Logo 区域 ===== */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🪙</span>
        <span className="sidebar-logo-text">K记</span>
      </div>

      {/* ===== 快捷操作："记一笔"按钮 ===== */}
      <button className="sidebar-add-btn" onClick={onAdd}>
        <PlusCircleOutlined style={{ fontSize: 18 }} />
        <span>记一笔</span>
      </button>

      {/* ===== 主导航菜单 ===== */}
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

      {/* ===== 底部信息区：月度预算余额展示 ===== */}
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
