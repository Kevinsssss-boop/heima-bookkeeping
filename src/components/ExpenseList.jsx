import { useState, useMemo } from 'react';
import { Popconfirm, Select, DatePicker } from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getCategoryIcon } from '../data/categories';
import dayjs from 'dayjs';

function ExpenseList({ expenses, loading, onEdit, onDelete }) {
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterMonth, setFilterMonth] = useState(null);

  const filtered = useMemo(() => {
    let list = expenses;
    if (filterCategory) {
      list = list.filter((e) => e.category1 === filterCategory);
    }
    if (filterMonth) {
      list = list.filter((e) => dayjs(e.date).format('YYYY-MM') === filterMonth.format('YYYY-MM'));
    }
    return list;
  }, [expenses, filterCategory, filterMonth]);

  const catOptions = [...new Set(expenses.map((e) => e.category1))].map((c) => ({
    value: c,
    label: `${getCategoryIcon(c)} ${c}`,
  }));

  if (loading) {
    return <div className="expense-empty"><div className="empty-text">加载中...</div></div>;
  }

  if (expenses.length === 0) {
    return (
      <div className="expense-empty">
        <div className="empty-icon">📒</div>
        <div className="empty-text">还没有记录</div>
        <div style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>
          点击左侧 "记一笔" 开始记账吧
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select
          placeholder="全部分类"
          allowClear
          value={filterCategory}
          onChange={setFilterCategory}
          options={catOptions}
          style={{ width: 180 }}
        />
        <DatePicker
          picker="month"
          placeholder="全部月份"
          allowClear
          value={filterMonth}
          onChange={setFilterMonth}
          style={{ width: 160 }}
          maxDate={dayjs()}
        />
        <span style={{ color: '#999', fontSize: 13, alignSelf: 'center' }}>
          共 {filtered.length} 条
        </span>
      </div>

      {/* 表格 */}
      {filtered.length > 0 ? (
        <div className="expense-list-desktop">
          <div className="expense-list-header">
            <span>分类</span>
            <span>子分类</span>
            <span>日期</span>
            <span>备注</span>
            <span style={{ textAlign: 'right' }}>金额</span>
          </div>
          {filtered.map((item) => (
            <div
              key={item.id}
              className="expense-row"
              onClick={() => onEdit(item)}
            >
              <div className="col-category">
                <span
                  className="col-icon"
                  style={{
                    background: getBg(item.category1),
                    color: getFg(item.category1),
                  }}
                >
                  {getCategoryIcon(item.category1)}
                </span>
                {item.category1}
              </div>
              <div className="col-sub">{item.category2}</div>
              <div className="col-date">{item.date}</div>
              <div className="col-note">{item.note || '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="col-amount" style={{ flex: 1 }}>
                  -¥{item.amount.toFixed(2)}
                </span>
                <Popconfirm
                  title="确定删除？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    onDelete(item.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="删除"
                  cancelText="取消"
                >
                  <DeleteOutlined
                    className="col-delete"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="expense-empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">没有匹配的记录</div>
        </div>
      )}
    </div>
  );
}

function getBg(cat) {
  const m = {
    '餐饮': '#fff2f0', '交通': '#e6f7ff', '购物': '#fff7e6',
    '住房': '#f6ffed', '娱乐': '#f9f0ff', '医疗': '#fff0f6',
    '教育': '#e6fffb', '通讯': '#fffbe6', '人情往来': '#fcffe6',
    '金融理财': '#f0f5ff', '其他': '#fafafa',
  };
  return m[cat] || '#fafafa';
}

function getFg(cat) {
  const m = {
    '餐饮': '#ff6b6b', '交通': '#4096ff', '购物': '#fa8c16',
    '住房': '#52c41a', '娱乐': '#9254de', '医疗': '#eb2f96',
    '教育': '#13c2c2', '通讯': '#d4a017', '人情往来': '#7cb305',
    '金融理财': '#597ef7', '其他': '#999',
  };
  return m[cat] || '#999';
}

export default ExpenseList;
