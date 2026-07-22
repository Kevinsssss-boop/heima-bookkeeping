import { useState, useEffect, useMemo } from 'react';
import { Modal, InputNumber, DatePicker, Input } from 'antd';
import dayjs from 'dayjs';
import { mergeCategories, getSubCategories } from '../data/categories';

/**
 * 记一笔 / 编辑记录 弹窗
 * 可视化分类选择器 + 金额输入 + 日期 + 备注
 */
function AddExpenseModal({ open, editingRecord, onSave, onCancel, customData }) {
  const [amount, setAmount] = useState(null);
  const [category1, setCategory1] = useState(null);
  const [category2, setCategory2] = useState(null);
  const [date, setDate] = useState(dayjs());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editingRecord;

  // 合并预置分类 + 自定义分类
  const categories = useMemo(() => mergeCategories(customData), [customData]);

  // 弹窗打开时初始化
  useEffect(() => {
    if (open) {
      if (editingRecord) {
        setAmount(editingRecord.amount);
        setCategory1(editingRecord.category1);
        setCategory2(editingRecord.category2);
        setDate(dayjs(editingRecord.date));
        setNote(editingRecord.note || '');
      } else {
        setAmount(null);
        setCategory1(null);
        setCategory2(null);
        setDate(dayjs());
        setNote('');
      }
    }
  }, [open, editingRecord]);

  // 切换一级分类时清空二级
  const handleCategory1Change = (val) => {
    setCategory1(val);
    setCategory2(null);
  };

  const handleSave = async () => {
    if (!amount || amount <= 0) return;
    if (!category1) return;
    if (!category2) return;

    setSaving(true);
    await onSave({
      amount,
      category1,
      category2,
      date: date.format('YYYY-MM-DD'),
      note,
    });
    setSaving(false);
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
      {/* ===== 金额输入 ===== */}
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

      {/* ===== 一级分类选择 ===== */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>选择分类</div>
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

      {/* ===== 二级分类选择 ===== */}
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
          maxDate={dayjs()}
          placeholder="选择日期"
        />
        <Input
          style={{ flex: 1.5 }}
          placeholder="备注（可选）"
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
