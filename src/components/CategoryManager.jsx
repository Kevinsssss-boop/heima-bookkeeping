import { useState } from 'react';
import { Modal, Input, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { presetCategories, presetSubIcons } from '../data/categories';
import { generateId } from '../utils/helpers';

/** 一级分类图标库 */
const CAT_EMOJI_OPTIONS = [
  '🍜', '🚗', '🛒', '🏠', '🎮', '💊', '📚', '📱', '👥', '💰', '📦',
  '🐱', '🐶', '👶', '💄', '✈️', '🎓', '🎁', '💻', '🏥', '🎵', '🍺',
  '☕', '🏋️', '🎨', '🌸', '🧹', '🎂', '💼', '📷', '🎸', '⚽', '🌿',
  '💍', '🔧', '🎪', '🍕', '🚲', '📺', '🧸', '💡',
];

/** 二级分类图标库（更紧凑） */
const SUB_EMOJI_OPTIONS = [
  '🍽️', '☕', '🍺', '🍕', '🥐', '🍱', '🍿', '🥤',
  '🚌', '🚕', '⛽', '🅿️', '🚄', '✈️', '🚲',
  '🛒', '👔', '📱', '🛋️', '💄', '🧴', '👟',
  '🏠', '💧', '⚡', '🔥', '🏢', '🔧', '🛌',
  '🎬', '🎮', '🎵', '🧳', '🏋️', '🎨',
  '💊', '🏥', '🩺', '🛡️',
  '📚', '📖', '✏️', '📝',
  '📞', '📶', '📦',
  '🎁', '🧧', '💝',
  '💰', '📉', '🏦',
  '🐱', '🐶', '👶', '🌱', '📌',
];

/**
 * 分类管理页面
 */
function CategoryManager({ customData, onSave }) {
  const { customCategories = [], customSubCategories = {} } = customData;

  // ====== 弹窗状态 ======
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  // ====== 添加一级分类表单 ======
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newSubs, setNewSubs] = useState([]);        // { label, icon }
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('📌');

  // ====== 编辑一级分类表单 ======
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📦');
  const [editSubs, setEditSubs] = useState([]);       // { label, icon }
  const [editSubLabel, setEditSubLabel] = useState('');
  const [editSubIcon, setEditSubIcon] = useState('📌');

  // ====== 行内添加二级分类 ======
  const [addingSubFor, setAddingSubFor] = useState(null);
  const [subLabel, setSubLabel] = useState('');
  const [subIcon, setSubIcon] = useState('📌');

  // ====== 行内编辑二级分类 ======
  const [editingSub, setEditingSub] = useState(null);
  // { catLabel, subId, isPreset }
  const [editingSubLabel, setEditingSubLabel] = useState('');
  const [editingSubIcon, setEditingSubIcon] = useState('📌');

  // ====== 弹窗内小类编辑 ======
  const [editingModalSubIdx, setEditingModalSubIdx] = useState(null);
  const [editingModalSubLabel, setEditingModalSubLabel] = useState('');
  const [editingModalSubIcon, setEditingModalSubIcon] = useState('📌');

  // ============ 一级分类操作 ============

  const openAddModal = () => {
    setNewName('');
    setNewIcon('📦');
    setNewSubs([]);
    setNewSubLabel('');
    setNewSubIcon('📌');
    setEditingModalSubIdx(null);
    setAddModalOpen(true);
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) { message.warning('请输入分类名称'); return; }
    const allNames = [
      ...presetCategories.map((c) => c.label),
      ...customCategories.map((c) => c.label),
    ];
    if (allNames.includes(name)) { message.warning('分类名称已存在'); return; }

    const newCat = {
      id: generateId(),
      label: name,
      icon: newIcon,
      children: newSubs.map((s) => ({
        id: generateId(),
        label: s.label,
        icon: s.icon,
      })),
    };
    onSave({
      ...customData,
      customCategories: [...customCategories, newCat],
    });
    setAddModalOpen(false);
    message.success('分类已添加');
  };

  const openEditModal = (cat) => {
    setEditingCat(cat);
    setEditName(cat.label);
    setEditIcon(cat.icon);
    setEditSubs(
      (cat.children || []).map((s) => ({
        label: typeof s === 'string' ? s : s.label,
        icon: typeof s === 'string' ? '📌' : (s.icon || '📌'),
      }))
    );
    setEditSubLabel('');
    setEditSubIcon('📌');
    setEditingModalSubIdx(null);
    setEditModalOpen(true);
  };

  const handleEdit = () => {
    const name = editName.trim();
    if (!name) { message.warning('请输入分类名称'); return; }
    const otherNames = customCategories
      .filter((c) => c.id !== editingCat.customId)
      .map((c) => c.label);
    if (otherNames.includes(name) || presetCategories.some((c) => c.label === name)) {
      message.warning('分类名称已存在'); return;
    }

    onSave({
      ...customData,
      customCategories: customCategories.map((c) => {
        if (c.id === editingCat.customId) {
          return {
            ...c,
            label: name,
            icon: editIcon,
            children: editSubs.map((s) => ({
              id: generateId(),
              label: s.label,
              icon: s.icon,
            })),
          };
        }
        return c;
      }),
    });
    setEditModalOpen(false);
    message.success('分类已更新');
  };

  const handleDelete = (cat) => {
    onSave({
      ...customData,
      customCategories: customCategories.filter((c) => c.id !== cat.customId),
    });
    message.success('分类已删除');
  };

  // ============ 二级分类操作 ============

  const handleAddSub = (catLabel, isPreset) => {
    const label = subLabel.trim();
    if (!label) { message.warning('请输入小类名称'); return; }

    if (isPreset) {
      const existing = customSubCategories[catLabel] || [];
      if (existing.some((s) => s.label === label)) {
        message.warning('小类名称已存在'); return;
      }
      const preset = presetCategories.find((c) => c.label === catLabel);
      if (preset?.children.includes(label)) {
        message.warning('该小类已存在于预置分类中'); return;
      }
      onSave({
        ...customData,
        customSubCategories: {
          ...customSubCategories,
          [catLabel]: [...existing, { id: generateId(), label, icon: subIcon }],
        },
      });
    } else {
      const cat = customCategories.find((c) => c.label === catLabel);
      const children = cat?.children || [];
      if (children.some((s) => (typeof s === 'string' ? s : s.label) === label)) {
        message.warning('小类名称已存在'); return;
      }
      onSave({
        ...customData,
        customCategories: customCategories.map((c) => {
          if (c.label === catLabel) {
            return {
              ...c,
              children: [...(c.children || []), { id: generateId(), label, icon: subIcon }],
            };
          }
          return c;
        }),
      });
    }

    setSubLabel('');
    setSubIcon('📌');
    setAddingSubFor(null);
    message.success('小类已添加');
  };

  const handleStartEditSub = (catLabel, subId, subLabel, subIcon, isPreset) => {
    setEditingSub({ catLabel, subId, isPreset });
    setEditingSubLabel(subLabel);
    setEditingSubIcon(subIcon || '📌');
  };

  const handleSaveEditSub = () => {
    if (!editingSub) return;
    const { catLabel, subId, isPreset } = editingSub;
    const newLabel = editingSubLabel.trim();
    if (!newLabel) { message.warning('名称不能为空'); return; }

    if (isPreset) {
      const existing = customSubCategories[catLabel] || [];
      const others = existing.filter((s) => s.id !== subId);
      if (others.some((s) => s.label === newLabel)) {
        message.warning('小类名称已存在'); return;
      }
      const preset = presetCategories.find((c) => c.label === catLabel);
      if (preset?.children.includes(newLabel)) {
        message.warning('该名称与预置小类重复'); return;
      }
      onSave({
        ...customData,
        customSubCategories: {
          ...customSubCategories,
          [catLabel]: existing.map((s) =>
            s.id === subId ? { ...s, label: newLabel, icon: editingSubIcon } : s
          ),
        },
      });
    } else {
      onSave({
        ...customData,
        customCategories: customCategories.map((c) => {
          if (c.label === catLabel) {
            return {
              ...c,
              children: (c.children || []).map((s) => {
                const sid = typeof s === 'string' ? undefined : s.id;
                if (sid === subId) {
                  return { ...(typeof s === 'string' ? { id: sid } : s), label: newLabel, icon: editingSubIcon };
                }
                return s;
              }),
            };
          }
          return c;
        }),
      });
    }

    setEditingSub(null);
    setEditingSubLabel('');
    setEditingSubIcon('📌');
    message.success('小类已更新');
  };

  const handleCancelEditSub = () => {
    setEditingSub(null);
    setEditingSubLabel('');
    setEditingSubIcon('📌');
  };

  const handleDeleteSub = (catLabel, subId, isPreset) => {
    if (isPreset) {
      const existing = customSubCategories[catLabel] || [];
      onSave({
        ...customData,
        customSubCategories: {
          ...customSubCategories,
          [catLabel]: existing.filter((s) => s.id !== subId),
        },
      });
    } else {
      onSave({
        ...customData,
        customCategories: customCategories.map((c) => {
          if (c.label === catLabel) {
            return {
              ...c,
              children: (c.children || []).filter((s) =>
                (typeof s === 'string' ? undefined : s.id) !== subId
              ),
            };
          }
          return c;
        }),
      });
    }
    message.success('小类已删除');
  };

  // ============ 弹窗内小类操作 ============

  const handleAddModalSub = (subs, setSubs, sLabel, sIcon, setSLabel, setSIcon) => {
    const label = sLabel.trim();
    if (!label) { message.warning('请输入小类名称'); return; }
    if (subs.some((s) => s.label === label)) {
      message.warning('小类名称已存在'); return;
    }
    setSubs([...subs, { label, icon: sIcon }]);
    setSLabel('');
    setSIcon('📌');
  };

  const handleStartEditModalSub = (idx, sub) => {
    setEditingModalSubIdx(idx);
    setEditingModalSubLabel(sub.label);
    setEditingModalSubIcon(sub.icon || '📌');
  };

  const handleSaveModalSub = (subs, setSubs) => {
    const newLabel = editingModalSubLabel.trim();
    if (!newLabel) { message.warning('名称不能为空'); return; }
    const others = subs.filter((_, i) => i !== editingModalSubIdx);
    if (others.some((s) => s.label === newLabel)) {
      message.warning('小类名称已存在'); return;
    }
    setSubs(
      subs.map((s, i) =>
        i === editingModalSubIdx
          ? { ...s, label: newLabel, icon: editingModalSubIcon }
          : s
      )
    );
    setEditingModalSubIdx(null);
    setEditingModalSubLabel('');
    setEditingModalSubIcon('📌');
  };

  // ============ 渲染辅助 ============

  const getNormalizedSubs = (cat, isPreset) => {
    if (isPreset) {
      const builtIn = cat.children.map((s) => ({
        label: s,
        icon: presetSubIcons[s] || '📌',
        isCustom: false,
      }));
      const extra = (customSubCategories[cat.label] || []).map((s) => ({
        label: s.label,
        icon: s.icon || '📌',
        id: s.id,
        isCustom: true,
      }));
      return [...builtIn, ...extra];
    } else {
      return (cat.children || []).map((s) => ({
        label: typeof s === 'string' ? s : s.label,
        icon: typeof s === 'string' ? '📌' : (s.icon || '📌'),
        id: typeof s === 'string' ? undefined : s.id,
        isCustom: true,
      }));
    }
  };

  /** 渲染图标选择器（一级分类） */
  const renderCatEmojiPicker = (selected, onChange) => (
    <div className="cm-emoji-grid">
      {CAT_EMOJI_OPTIONS.map((emoji) => (
        <span
          key={emoji}
          className={`cm-emoji-item ${selected === emoji ? 'selected' : ''}`}
          onClick={() => onChange(emoji)}
        >
          {emoji}
        </span>
      ))}
    </div>
  );

  /** 渲染图标选择器（二级分类，紧凑版） */
  const renderSubEmojiPicker = (selected, onChange) => (
    <div className="cm-sub-emoji-grid">
      {SUB_EMOJI_OPTIONS.map((emoji) => (
        <span
          key={emoji}
          className={`cm-sub-emoji-item ${selected === emoji ? 'selected' : ''}`}
          onClick={() => onChange(emoji)}
        >
          {emoji}
        </span>
      ))}
    </div>
  );

  /** 渲染小类卡片网格 */
  const renderSubCardGrid = (subs, catLabel, isPreset) => {
    if (subs.length === 0) {
      return <span className="cm-sub-empty">暂无小类</span>;
    }

    return (
      <div className="cm-sub-grid">
        {subs.map((sub) => {
          const isEditing =
            editingSub &&
            editingSub.catLabel === catLabel &&
            editingSub.subId === sub.id &&
            editingSub.isPreset === isPreset;

          if (isEditing) {
            return (
              <div key={sub.label + '-edit'} className="cm-sub-card editing">
                <div className="cm-sub-card-icon">
                  <span
                    className="cm-sub-card-emoji"
                    onClick={() => {
                      // cycle through a few icons
                      const idx = SUB_EMOJI_OPTIONS.indexOf(editingSubIcon);
                      setEditingSubIcon(
                        SUB_EMOJI_OPTIONS[(idx + 1) % SUB_EMOJI_OPTIONS.length]
                      );
                    }}
                    title="点击切换图标"
                  >
                    {editingSubIcon}
                  </span>
                </div>
                <Input
                  size="small"
                  value={editingSubLabel}
                  onChange={(e) => setEditingSubLabel(e.target.value)}
                  onPressEnter={handleSaveEditSub}
                  onBlur={handleCancelEditSub}
                  autoFocus
                  maxLength={10}
                  className="cm-sub-card-input"
                />
              </div>
            );
          }

          const canEdit = sub.isCustom && sub.id;
          return (
            <div
              key={sub.label}
              className={`cm-sub-card ${sub.isCustom ? 'custom' : 'preset'}`}
              onClick={() => {
                if (canEdit) {
                  handleStartEditSub(catLabel, sub.id, sub.label, sub.icon, isPreset);
                }
              }}
              title={canEdit ? '点击修改名称和图标' : '预置小类，不可修改'}
            >
              <span className="cm-sub-card-icon">{sub.icon}</span>
              <span className="cm-sub-card-label">{sub.label}</span>
              {sub.isCustom && sub.id && (
                <Popconfirm
                  title="删除此小类？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteSub(catLabel, sub.id, isPreset);
                  }}
                  okText="删除"
                  cancelText="取消"
                >
                  <span
                    className="cm-sub-card-del"
                    onClick={(e) => e.stopPropagation()}
                    title="删除"
                  >
                    ×
                  </span>
                </Popconfirm>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /** 渲染弹窗内的小类列表 */
  const renderModalSubList = (subs, setSubs) => (
    <div className="cm-sub-grid" style={{ marginTop: 8 }}>
      {subs.map((sub, idx) => {
        if (editingModalSubIdx === idx) {
          return (
            <div key={idx + '-edit'} className="cm-sub-card custom editing">
              <div className="cm-sub-card-icon">
                <span
                  className="cm-sub-card-emoji"
                  onClick={() => {
                    const i = SUB_EMOJI_OPTIONS.indexOf(editingModalSubIcon);
                    setEditingModalSubIcon(
                      SUB_EMOJI_OPTIONS[(i + 1) % SUB_EMOJI_OPTIONS.length]
                    );
                  }}
                  title="点击切换图标"
                >
                  {editingModalSubIcon}
                </span>
              </div>
              <Input
                size="small"
                value={editingModalSubLabel}
                onChange={(e) => setEditingModalSubLabel(e.target.value)}
                onPressEnter={() => handleSaveModalSub(subs, setSubs)}
                onBlur={() => {
                  setEditingModalSubIdx(null);
                  setEditingModalSubLabel('');
                  setEditingModalSubIcon('📌');
                }}
                autoFocus
                maxLength={10}
                className="cm-sub-card-input"
              />
            </div>
          );
        }
        return (
          <div
            key={sub.label}
            className="cm-sub-card custom"
            onClick={() => handleStartEditModalSub(idx, sub)}
            title="点击修改名称和图标"
          >
            <span className="cm-sub-card-icon">{sub.icon || '📌'}</span>
            <span className="cm-sub-card-label">{sub.label}</span>
            <span
              className="cm-sub-card-del"
              onClick={(e) => {
                e.stopPropagation();
                setSubs(subs.filter((s) => s.label !== sub.label));
              }}
              title="删除"
            >
              ×
            </span>
          </div>
        );
      })}
    </div>
  );

  /** 渲染一个分类卡片 */
  const renderCard = (cat, isPreset) => {
    const subs = getNormalizedSubs(cat, isPreset);
    const isAdding = addingSubFor === cat.label;

    return (
      <div
        key={cat.label}
        className={`cm-category-card ${isPreset ? 'preset' : 'custom'}`}
      >
        <div className="cm-cat-header">
          <span className="cm-cat-icon">{cat.icon}</span>
          <span className="cm-cat-name">{cat.label}</span>
          <div className="cm-cat-actions">
            {isPreset ? (
              <span className="cm-cat-badge preset-badge">
                <LockOutlined /> 预置
              </span>
            ) : (
              <>
                <button
                  className="cm-icon-btn edit"
                  onClick={() => openEditModal(cat)}
                  title="编辑分类"
                >
                  <EditOutlined />
                </button>
                <Popconfirm
                  title="确定删除此分类？"
                  description="该分类下的所有小类也会被删除"
                  onConfirm={() => handleDelete(cat)}
                  okText="删除"
                  cancelText="取消"
                >
                  <button className="cm-icon-btn delete" title="删除分类">
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </>
            )}
          </div>
        </div>

        {renderSubCardGrid(subs, cat.label, isPreset)}

        {isAdding ? (
          <div className="cm-add-sub-area">
            <div className="cm-add-sub-row">
              <Input
                size="small"
                placeholder="输入小类名称"
                value={subLabel}
                onChange={(e) => setSubLabel(e.target.value)}
                onPressEnter={() => handleAddSub(cat.label, isPreset)}
                autoFocus
                maxLength={10}
                style={{ width: 160 }}
              />
              <button
                className="cm-btn-small primary"
                onClick={() => handleAddSub(cat.label, isPreset)}
              >
                确定
              </button>
              <button
                className="cm-btn-small"
                onClick={() => {
                  setAddingSubFor(null);
                  setSubLabel('');
                  setSubIcon('📌');
                }}
              >
                取消
              </button>
            </div>
            <div className="cm-add-sub-icon-row">
              <span className="cm-add-sub-icon-label">选择图标：</span>
              {renderSubEmojiPicker(subIcon, setSubIcon)}
            </div>
          </div>
        ) : (
          <button
            className="cm-add-sub-btn"
            onClick={() => setAddingSubFor(cat.label)}
          >
            <PlusOutlined /> 添加小类
          </button>
        )}
      </div>
    );
  };

  // ============ 主渲染 ============

  return (
    <div className="category-manager">
      <div className="cm-header">
        <h2>📂 分类管理</h2>
        <button className="cm-add-cat-btn" onClick={openAddModal}>
          <PlusOutlined /> 添加一级分类
        </button>
      </div>

      <div className="cm-section">
        <h3 className="cm-section-title">预置分类（不可修改）</h3>
        <div className="cm-cards">
          {presetCategories.map((cat) => renderCard(cat, true))}
        </div>
      </div>

      <div className="cm-section">
        <h3 className="cm-section-title">自定义分类</h3>
        <div className="cm-cards">
          {customCategories.map((cat) => renderCard(cat, false))}
          {customCategories.length === 0 && (
            <div className="cm-empty">
              暂无自定义分类，点击右上角"添加一级分类"创建
            </div>
          )}
        </div>
      </div>

      {/* ====== 新增一级分类弹窗 ====== */}
      <Modal
        title="添加一级分类"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => {
          setAddModalOpen(false);
          setEditingModalSubIdx(null);
        }}
        okText="保存"
        cancelText="取消"
        centered
        destroyOnClose
        okButtonProps={{ disabled: !newName.trim() }}
      >
        <div className="cm-form-item">
          <label>分类名称</label>
          <Input
            placeholder="例如：宠物"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={10}
            autoFocus
          />
        </div>

        <div className="cm-form-item">
          <label>选择图标</label>
          {renderCatEmojiPicker(newIcon, setNewIcon)}
        </div>

        <div className="cm-form-item">
          <label>小类列表（点击可修改名称和图标）</label>
          <div className="cm-sub-input-row">
            <Input
              placeholder="输入小类名称"
              value={newSubLabel}
              onChange={(e) => setNewSubLabel(e.target.value)}
              onPressEnter={() =>
                handleAddModalSub(newSubs, setNewSubs, newSubLabel, newSubIcon, setNewSubLabel, setNewSubIcon)
              }
              maxLength={10}
            />
            <button
              className="cm-btn-small primary"
              onClick={() =>
                handleAddModalSub(newSubs, setNewSubs, newSubLabel, newSubIcon, setNewSubLabel, setNewSubIcon)
              }
            >
              添加
            </button>
          </div>
          <div className="cm-add-sub-icon-row" style={{ marginTop: 6 }}>
            <span className="cm-add-sub-icon-label">图标：</span>
            {renderSubEmojiPicker(newSubIcon, setNewSubIcon)}
          </div>
          {newSubs.length > 0 && renderModalSubList(newSubs, setNewSubs)}
        </div>
      </Modal>

      {/* ====== 编辑一级分类弹窗 ====== */}
      <Modal
        title="编辑分类"
        open={editModalOpen}
        onOk={handleEdit}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingModalSubIdx(null);
        }}
        okText="保存"
        cancelText="取消"
        centered
        destroyOnClose
        okButtonProps={{ disabled: !editName.trim() }}
      >
        <div className="cm-form-item">
          <label>分类名称</label>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={10}
            autoFocus
          />
        </div>

        <div className="cm-form-item">
          <label>选择图标</label>
          {renderCatEmojiPicker(editIcon, setEditIcon)}
        </div>

        <div className="cm-form-item">
          <label>小类列表（点击可修改名称和图标）</label>
          <div className="cm-sub-input-row">
            <Input
              placeholder="输入小类名称"
              value={editSubLabel}
              onChange={(e) => setEditSubLabel(e.target.value)}
              onPressEnter={() =>
                handleAddModalSub(editSubs, setEditSubs, editSubLabel, editSubIcon, setEditSubLabel, setEditSubIcon)
              }
              maxLength={10}
            />
            <button
              className="cm-btn-small primary"
              onClick={() =>
                handleAddModalSub(editSubs, setEditSubs, editSubLabel, editSubIcon, setEditSubLabel, setEditSubIcon)
              }
            >
              添加
            </button>
          </div>
          <div className="cm-add-sub-icon-row" style={{ marginTop: 6 }}>
            <span className="cm-add-sub-icon-label">图标：</span>
            {renderSubEmojiPicker(editSubIcon, setEditSubIcon)}
          </div>
          {editSubs.length > 0 && renderModalSubList(editSubs, setEditSubs)}
        </div>
      </Modal>
    </div>
  );
}

export default CategoryManager;