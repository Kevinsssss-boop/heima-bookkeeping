/**
 * K记 App 主应用组件
 *
 * 职责：
 *   1. 管理全局状态（支出记录、设置、自定义分类、UI 状态）
 *   2. 协调各子组件的渲染（侧边栏、仪表盘、账单列表、统计等）
 *   3. 处理用户的增删改查操作（记一笔、编辑、删除、设置预算）
 *
 * 数据流：
 *   Electron IPC / localStorage → storage.js → App.state → 各子组件 props
 */
import { useState, useEffect, useCallback } from 'react';
import { Modal, InputNumber, message } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import StatsView from './components/StatsView';
import CategoryManager from './components/CategoryManager';
import SnakeGame from './components/SnakeGame';
import {
  getExpenses, addExpense, updateExpense, deleteExpense,
  getSettings, saveSettings, getCustomCategoriesData, saveCustomCategoriesData,
} from './utils/storage';
import { generateId } from './utils/helpers';
import './App.css';

function App() {
  // ====== 全局状态 ======

  /** 支出记录列表 */
  const [expenses, setExpenses] = useState([]);
  /** 是否正在加载数据（显示加载中状态） */
  const [loading, setLoading] = useState(true);
  /** 当前激活的视图标签（dashboard/expenses/stats/categories/snake） */
  const [activeView, setActiveView] = useState('dashboard');
  /** 记一笔弹窗是否打开 */
  const [modalOpen, setModalOpen] = useState(false);
  /** 正在编辑的记录（null 表示新增模式） */
  const [editingRecord, setEditingRecord] = useState(null);
  /** 用户设置（月度预算等） */
  const [settings, setSettings] = useState({ monthlyBudget: 0 });
  /** 自定义分类数据（用户创建的分类 + 追加的子分类） */
  const [customData, setCustomData] = useState({ customCategories: [], customSubCategories: {} });
  /** 预算设置弹窗是否打开 */
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  /** 预算输入框的临时值 */
  const [budgetInput, setBudgetInput] = useState(0);

  // ====== 数据加载 ======
  // 组件挂载时自动加载所有数据：支出记录 + 设置 + 自定义分类
  useEffect(() => { loadData(); }, []);

  /**
   * 加载所有数据（并行请求，更快）
   * - 支出记录按日期倒序排列（最新的在前面）
   * - 加载失败时显示错误提示，不会白屏
   */
  const loadData = async () => {
    try {
      // 同时发起三个数据请求，Promise.all 等待全部完成
      const [expData, settingsData, custData] = await Promise.all([
        getExpenses(),
        Promise.resolve(getSettings()),       // getSettings 是同步的，包一层 Promise 统一处理
        getCustomCategoriesData(),
      ]);
      // 按日期倒序排列（新记录在前）
      expData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expData);
      setSettings(settingsData);
      setCustomData(custData);
    } catch (err) {
      console.error('加载数据失败：', err);
      message.error('数据加载失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // ====== 记一笔相关操作 ======

  /** 打开"记一笔"弹窗（新增模式） */
  const handleAdd = useCallback(() => {
    setEditingRecord(null);   // 清空编辑状态，表示这是新增不是修改
    setModalOpen(true);
  }, []);

  /** 打开"记一笔"弹窗（编辑模式），并回填已有数据 */
  const handleEdit = useCallback((record) => {
    setEditingRecord(record);  // 记住要编辑的那条记录
    setModalOpen(true);
  }, []);

  /**
   * 保存支出记录（新增或更新都有）
   * - 编辑模式：调用 updateExpense 更新原记录
   * - 新增模式：调用 addExpense 新建记录（自动生成 ID 和时间戳）
   * - 保存后自动刷新数据，确保界面最新
   * - 保存失败时给用户提示错误
   */
  const handleSave = useCallback(async (values) => {
    try {
      if (editingRecord) {
        // 编辑模式：更新已有记录
        await updateExpense({ ...editingRecord, ...values });
        message.success('✅ 记录已更新');
      } else {
        // 新增模式：创建新记录
        await addExpense({
          id: generateId(),
          ...values,
          createdAt: new Date().toISOString(),
        });
        message.success('✅ 记录已保存');
      }
      // 关闭弹窗、清除编辑状态、刷新数据
      setModalOpen(false);
      setEditingRecord(null);
      loadData();
    } catch (err) {
      console.error('保存记录失败：', err);
      message.error('❌ 保存失败，请重试');
    }
  }, [editingRecord]);

  /**
   * 删除支出记录
   * - 调用 deleteExpense 删除指定 ID 的记录
   * - 删除后自动刷新数据
   * - 删除失败时给用户提示错误
   */
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteExpense(id);
      message.success('🗑️ 已删除该条记录');
      loadData();
    } catch (err) {
      console.error('删除记录失败：', err);
      message.error('❌ 删除失败，请重试');
    }
  }, []);

  // ====== 预算设置 ======

  /**
   * 保存月度预算设置
   * - 更新本地设置 + 持久化存储
   * - 关闭预算弹窗
   */
  const handleBudgetSave = () => {
    const newSettings = { ...settings, monthlyBudget: budgetInput };
    setSettings(newSettings);
    saveSettings(newSettings);
    setBudgetModalOpen(false);
    message.success('💰 预算已更新');
  };

  /**
   * 保存自定义分类数据（从 CategoryManager 回调过来）
   * - 更新内存状态 + 持久化存储
   */
  const handleSaveCustomData = (data) => {
    setCustomData(data);
    saveCustomCategoriesData(data);
  };

  // ====== 打开预算设置弹窗（复用逻辑提取为函数） ======

  /** 打开预算设置弹窗，并预填当前预算值 */
  const openBudgetModal = () => {
    setBudgetInput(settings.monthlyBudget);
    setBudgetModalOpen(true);
  };

  // ====== 视图路由渲染 ======

  /**
   * 根据当前激活的视图标签，渲染对应的内容组件
   *   dashboard → 总览仪表盘（统计卡片 + 饼图 + 最近记录）
   *   expenses  → 账单明细列表（可筛选、可编辑、可删除）
   *   stats     → 年度统计分析（月度趋势图 + 分类饼图 + 排行榜）
   *   categories → 分类管理（增删改自定义分类和子类图标）
   *   snake     → 贪吃蛇小游戏
   */
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            expenses={expenses}
            monthlyBudget={settings.monthlyBudget}
          />
        );
      case 'expenses':
        return (
          <ExpenseList
            expenses={expenses}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            customData={customData}
          />
        );
      case 'stats':
        return (
          <StatsView
            expenses={expenses}
            monthlyBudget={settings.monthlyBudget}
          />
        );
      case 'categories':
        return (
          <CategoryManager
              customData={customData}
              onSave={handleSaveCustomData}
            />
          );
      case 'snake':
        return <SnakeGame key="snake" />; // key 防止 React 复用旧实例导致游戏状态混乱
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      {/* 左侧边栏：Logo + 记一笔按钮 + 导航菜单 + 底部预算显示 */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onAdd={handleAdd}
        monthlyBudget={settings.monthlyBudget}
        onBudgetClick={openBudgetModal}
      />

      {/* 右侧主内容区：标题栏 + 内容区 + 弹窗 */}
      <div className="main-content">
        {/* 标题栏：根据当前视图动态显示标题 + 快捷预算按钮 */}
        <header className="content-header">
          <h2>
            {activeView === 'dashboard' && '📊 收支总览'}
            {activeView === 'expenses' && '📋 账单明细'}
            {activeView === 'stats' && '📈 统计分析'}
            {activeView === 'categories' && '📂 分类管理'}
            {activeView === 'snake' && '🐍 贪吃蛇'}
          </h2>
          <div className="header-actions">
            {/* 快捷预算按钮：点击直接打开预算设置弹窗 */}
            <button className="header-budget-btn" onClick={openBudgetModal}>
              月预算: ¥{settings.monthlyBudget > 0 ? settings.monthlyBudget.toLocaleString() : '未设置'}
            </button>
          </div>
        </header>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>

      {/* 记一笔/编辑记录 弹窗 */}
      <AddExpenseModal
        open={modalOpen}
        editingRecord={editingRecord}
        onSave={handleSave}
        onCancel={() => { setModalOpen(false); setEditingRecord(null); }}
        customData={customData}
      />

      {/* 月度预算设置弹窗 */}
      <Modal
        title="设置月度预算"
        open={budgetModalOpen}
        onOk={handleBudgetSave}
        onCancel={() => setBudgetModalOpen(false)}
        okText="保存"
        cancelText="取消"
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
            设定每月预算上限，超支时会提醒你 💰
          </div>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={0}
            max={999999}
            precision={2}
            prefix="¥"
            value={budgetInput}
            onChange={setBudgetInput}
            placeholder="例如 3000"
          />
          {/* 常用金额快捷选择按钮 */}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            {[1000, 2000, 3000, 5000, 8000].map((n) => (
              <button
                key={n}
                onClick={() => setBudgetInput(n)}
                className={`quick-budget-btn ${budgetInput === n ? 'active' : ''}`}
              >
                ¥{n}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
