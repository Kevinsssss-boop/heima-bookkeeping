import { useState, useEffect, useCallback } from 'react';
import { Modal, InputNumber, message } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import StatsView from './components/StatsView';
import CategoryManager from './components/CategoryManager';
import { getExpenses, addExpense, updateExpense, deleteExpense, getSettings, saveSettings, getCustomCategoriesData, saveCustomCategoriesData } from './utils/storage';
import { generateId } from './utils/helpers';
import './App.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [settings, setSettings] = useState({ monthlyBudget: 0 });
  const [customData, setCustomData] = useState({ customCategories: [], customSubCategories: {} });
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [expData, sett, custData] = await Promise.all([
        getExpenses(),
        Promise.resolve(getSettings()),
        getCustomCategoriesData(),
      ]);
      expData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expData);
      setSettings(sett);
      setCustomData(custData);
    } catch (err) {
      console.error('加载数据失败：', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((record) => {
    setEditingRecord(record);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback((values) => {
    if (editingRecord) {
      updateExpense({ ...editingRecord, ...values });
    } else {
      addExpense({ id: generateId(), ...values, createdAt: new Date().toISOString() });
    }
    setModalOpen(false);
    setEditingRecord(null);
    loadData();
  }, [editingRecord]);

  const handleDelete = useCallback((id) => {
    deleteExpense(id);
    loadData();
  }, []);

  const handleBudgetSave = () => {
    const newSettings = { ...settings, monthlyBudget: budgetInput };
    setSettings(newSettings);
    saveSettings(newSettings);
    setBudgetModalOpen(false);
    message.success('预算已更新');
  };

  const handleSaveCustomData = (data) => {
    setCustomData(data);
    saveCustomCategoriesData(data);
  };

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
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onAdd={handleAdd}
        monthlyBudget={settings.monthlyBudget}
        onBudgetClick={() => {
          setBudgetInput(settings.monthlyBudget);
          setBudgetModalOpen(true);
        }}
      />

      {/* 主内容区 */}
      <div className="main-content">
        <header className="content-header">
          <h2>
            {activeView === 'dashboard' && '📊 收支总览'}
            {activeView === 'expenses' && '📋 账单明细'}
            {activeView === 'stats' && '📈 统计分析'}
            {activeView === 'categories' && '📂 分类管理'}
          </h2>
          <div className="header-actions">
            <button className="header-budget-btn" onClick={() => {
              setBudgetInput(settings.monthlyBudget);
              setBudgetModalOpen(true);
            }}>
              月预算: ¥{settings.monthlyBudget > 0 ? settings.monthlyBudget.toLocaleString() : '未设置'}
            </button>
          </div>
        </header>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>

      {/* 记一笔弹窗 */}
      <AddExpenseModal
        open={modalOpen}
        editingRecord={editingRecord}
        onSave={handleSave}
        onCancel={() => { setModalOpen(false); setEditingRecord(null); }}
        customData={customData}
      />

      {/* 预算设置弹窗 */}
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
            设定每月预算上限，超支时会提醒你
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
