/**
 * 记一笔 / 编辑记录 弹窗组件
 *
 * 功能：
 *   1. 新增支出记录：选择金额 → 选分类（一级+二级）→ 选日期 → 填备注 → 保存
 *   2. 编辑已有记录：自动回填所有字段，保存后更新原记录
 *
 * 交互细节：
 *   - 选择一级分类后，才显示对应的二级子分类（联动）
 *   - 切换一级分类时，自动清空已选的二级分类（避免数据不一致）
 *   - 日期默认为今天，不允许选未来日期
 *   - 金额必须 > 0，且必须选完一级和二级分类才能保存
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, InputNumber, DatePicker, Input, message } from 'antd';
import dayjs from 'dayjs';
import { mergeCategories, getSubCategories } from '../data/categories';

function AddExpenseModal({ open, editingRecord, onSave, onCancel, customData }) {
  // ====== 表单状态 ======

  /** 用户输入的金额（单位：元） */
  const [amount, setAmount] = useState(null);
  /** 用户选择的一级分类（如：餐饮、交通、购物） */
  const [category1, setCategory1] = useState(null);
  /** 用户选择的二级分类（如：早餐、午餐、晚餐） */
  const [category2, setCategory2] = useState(null);
  /** 选择的日期，默认今天 */
  const [date, setDate] = useState(dayjs());
  /** 备注内容（可选，最多100字） */
  const [note, setNote] = useState('');
  /** 是否正在保存中（防止重复点击） */
  const [saving, setSaving] = useState(false);

  /** 当前是否为编辑模式（true=编辑，false=新增） */
  const isEdit = !!editingRecord;

  // 合并预置分类 + 自定义分类，供选择器使用
  const categories = useMemo(() => mergeCategories(customData), [customData]);

  // ====== 弹窗打开/关闭时的初始化/清理 ======

  /**
   * 弹窗打开时根据模式初始化表单：
   *   - 编辑模式：从 editingRecord 回填所有字段
   *   - 新增模式：全部重置为空/默认值
   */
  useEffect(() => {
    if (open) {
      if (editingRecord) {
        // 编辑模式：回填已有数据
        setAmount(editingRecord.amount);
        setCategory1(editingRecord.category1);
        setCategory2(editingRecord.category2);
        setDate(dayjs(editingRecord.date));
        setNote(editingRecord.note || '');
      } else {
        // 新增模式：重置为空
        setAmount(null);
        setCategory1(null);
        setCategory2(null);
        setDate(dayjs());
        setNote('');
      }
    }
  }, [open, editingRecord]);

  /**
   * 切换一级分类时，清空二级分类的选择
   * （因为不同一级分类下的二级选项完全不同，避免选错）
   */
  const handleCategory1Change = (val) => {
    setCategory1(val);
    setCategory2(null);  // 二级分类要重新选
  };

  /**
   * 点击保存按钮时的校验和提交逻辑
   * 校验规则：
   *   1. 金额必须填写且大于 0
   *   2. 必须选择一级分类
   *   3. 必须选择二级分类
   * 不满足条件时会静默拦截（不弹窗），不会报错
   */
  const handleSave = async () => {
    // 校验1：金额检查
    if (!amount || amount <= 0) {
      message.warning('⚠️ 请输入有效的金额（必须大于 0）');
      return;
    }
    // 校验2：一级分类检查
    if (!category1) {
      message.warning('⚠️ 请先选择一个分类（如：🍜 餐饮、🚗 交通）');
      return;
    }
    // 校验3：二级分类检查
    if (!category2) {
      message.warning(`⚠️ 请选择「${category1}」下的具体分类`);
      return;
    }

    // 校验通过，开始保存
    setSaving(true);
    try {
      await onSave({
        amount,
        category1,
        category2,
        date: date.format('YYYY-MM-DD'),
        note,
      });
    } catch (err) {
      console.error('保存失败：', err);
      message.error('❌ 保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑记录' : '记一笔'}
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ disabled: !amount || !category2 }}
      destroyOnClose
      centered
      width={420}
      styles={{ body: { padding: '16px 20px 24px' } }}
    >
      {/* ===== 金额输入区 ===== */}
      <div className="amount-label">金额</div>
      <div className={`amount-display ${amount ? 'has-value' : ''}`}>
        {amount ? `¥${amount.toFixed(2)}` : '¥0.00'}
      </div>
      <InputNumber
        style={{ width: '100%', marginBottom: 16 }}
        placeholder="输入金额"
        precision={2}
        min={0.01}
        max={9999999.99}
        value={amount}
        onChange={setAmount}
        size="large"
        autoFocus
      />

      {/* ===== 分类选择区（两级联动）===== */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>选择分类</div>
        {/* 一级分类网格：点击选择大类 */}
        <div className="category-grid">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className={`category-grid-item ${category1 === cat.label ? 'selected' : ''}`}
              onClick={() => handleCategory1Change(cat.label)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-label">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 二级分类网格：选择一级后才显示对应的子类 */}
      {category1 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>具体分类</div>
          <div className="subcategory-grid">
            {getSubCategories(category1, categories).map((sub) => (
              <div
                key={sub.value}
                className={`subcategory-item ${category2 === sub.value ? 'selected' : ''}`}
                onClick={() => setCategory2(sub.value)}
              >
                {sub.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 日期 + 备注 ===== */}
      <div style={{ display: 'flex', gap: 12 }}>
        <DatePicker
          style={{ flex: 1 }}
          value={date}
          onChange={setDate}
          size="large"
          format="YYYY-MM-DD"
          allowClear={false}
          maxDate={dayjs()}  // 不允许选未来日期
          placeholder="选择日期"
        />
        <Input
          style={{ flex: 1.5 }}
          placeholder="备注（可选，最多100字）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
          size="large"
        />
      </div>
    </Modal>
  );
}

export default AddExpenseModal;
