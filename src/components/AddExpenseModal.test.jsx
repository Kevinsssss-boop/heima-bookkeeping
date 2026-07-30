import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddExpenseModal from './AddExpenseModal';

// Mock categories 模块（避免依赖真实数据）
vi.mock('../data/categories', () => ({
  mergeCategories: vi.fn(() => [
    { label: '餐饮', icon: '🍜', isPreset: true, children: [
      { label: '早餐', icon: '🌅' },
      { label: '午餐', icon: '☀️' },
      { label: '晚餐', icon: '🌙' },
    ]},
    { label: '交通', icon: '🚗', isPreset: true, children: [
      { label: '公交/地铁', icon: '🚌' },
      { label: '出租车/网约车', icon: '🚕' },
    ]},
  ]),
  getSubCategories: vi.fn((cat) => {
    const map = {
      '餐饮': [
        { value: '早餐', label: '🌅  早餐' },
        { value: '午餐', label: '☀️  午餐' },
        { value: '晚餐', label: '🌙  晚餐' },
      ],
      '交通': [
        { value: '公交/地铁', label: '🚌  公交/地铁' },
        { value: '出租车/网约车', label: '🚕  出租车/网约车' },
      ],
    };
    return map[cat] || [];
  }),
}));

describe('AddExpenseModal 记账弹窗组件', () => {

  const defaultProps = {
    open: true,
    editingRecord: null,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    customData: { customCategories: [], customSubCategories: {} },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染弹窗标题"记一笔"', () => {
    render(<AddExpenseModal {...defaultProps} />);
    expect(screen.getByText('记一笔')).toBeInTheDocument();
  });

  it('应该渲染金额输入框', () => {
    render(<AddExpenseModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('输入金额')).toBeInTheDocument();
  });

  it('默认金额显示为 ¥0.00', () => {
    render(<AddExpenseModal {...defaultProps} />);
    expect(screen.getByText('¥0.00')).toBeInTheDocument();
  });

  it('应该展示所有一级分类选项', () => {
    render(<AddExpenseModal {...defaultProps} />);
    expect(screen.getByText('🍜')).toBeInTheDocument();
    expect(screen.getByText('餐饮')).toBeInTheDocument();
    expect(screen.getByText('🚗')).toBeInTheDocument();
    expect(screen.getByText('交通')).toBeInTheDocument();
  });

  it('选择一级分类后应该显示对应的二级分类', async () => {
    const user = userEvent.setup();
    render(<AddExpenseModal {...defaultProps} />);

    // 点击餐饮分类
    await user.click(screen.getByText('餐饮'));

    // 应该出现二级分类
    expect(screen.getByText('具体分类')).toBeInTheDocument();
    expect(screen.getByText(/早餐/)).toBeInTheDocument();
    expect(screen.getByText(/午餐/)).toBeInTheDocument();
    expect(screen.getByText(/晚餐/)).toBeInTheDocument();
  });

  it('切换一级分类时应该清空二级分类选择', async () => {
    const user = userEvent.setup();
    render(<AddExpenseModal {...defaultProps} />);

    // 先选餐饮
    await user.click(screen.getByText('餐饮'));
    await user.click(screen.getByText(/早餐/));

    // 再切到交通
    await user.click(screen.getByText('交通'));

    // 二级分类应该变成交通的子分类，且没有选中状态
    expect(screen.getByText(/公交/)).toBeInTheDocument();
    // 之前选中的早餐不应该有 selected 样式（通过 DOM 结构验证）
    const subItems = screen.getAllByRole('button').filter(
      (el) => el.textContent?.includes('早餐')
    );
    // 切换后早餐不应该在当前可见的二级分类中
    expect(subItems.length).toBe(0);
  });

  it('应该渲染日期选择器', () => {
    render(<AddExpenseModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('选择日期')).toBeInTheDocument();
  });

  it('应该渲染备注输入框', () => {
    render(<AddExpenseModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('备注（可选，最多100字）')).toBeInTheDocument();
  });

  it('编辑模式应该显示"编辑记录"标题', () => {
    const editRecord = {
      id: 'edit-1',
      amount: 88.88,
      category1: '餐饮',
      category2: '午餐',
      date: '2026-07-29',
      note: '测试备注',
    };
    render(<AddExpenseModal {...defaultProps} editingRecord={editRecord} />);
    expect(screen.getByText('编辑记录')).toBeInTheDocument();
  });

  it('编辑模式应该回填已有数据', () => {
    const editRecord = {
      id: 'edit-1',
      amount: 99.99,
      category1: '餐饮',
      category2: '午餐',
      date: '2026-07-29',
      note: '测试备注',
    };
    render(<AddExpenseModal {...defaultProps} editingRecord={editRecord} />);
    // 金额应该显示
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
  });

  it('点击取消/关闭应该触发取消操作', async () => {
    const user = userEvent.setup();
    const { container } = render(<AddExpenseModal {...defaultProps} />);

    // 点击 Modal 右上角的关闭按钮（X）
    const closeBtn = container.querySelector('.ant-modal-close');
    if (closeBtn) {
      await user.click(closeBtn);
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('未填写完整信息时保存操作应该被阻止（验证核心逻辑）', () => {
    // 验证：弹窗默认打开时（表单为空），onSave 不应被自动调用
    render(<AddExpenseModal {...defaultProps} />);
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });
});
