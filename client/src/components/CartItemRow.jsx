import { memo, useState } from 'react';
import { SIZES, categoryLabel, formatPrice } from '../data/catalog';
import validateItem from '../utils/validateItem';

/** Строка корзины: просмотр, изменение количества, редактирование и удаление. */
function CartItemRow({ item, isEditing, onStartEdit, onCancelEdit, onSave, onRemove, onChangeQuantity }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);

  const startEdit = () => {
    setDraft({ title: item.title, size: item.size, color: item.color, price: String(item.price), quantity: String(item.quantity) });
    setError(null);
    onStartEdit(item.id);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const save = () => {
    const message = validateItem(draft);
    if (message) {
      setError(message);
      return;
    }
    onSave(item.id, {
      title: draft.title.trim(),
      size: draft.size,
      color: draft.color.trim(),
      price: Math.round(Number(draft.price) * 100) / 100,
      quantity: Number(draft.quantity)
    });
  };

  // Горячие клавиши в режиме редактирования: Enter — сохранить, Escape — отменить.
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  if (isEditing && draft) {
    return (
      <li className="cart-item editing" onKeyDown={handleKeyDown}>
        <div className="edit-grid">
          <input name="title" value={draft.title} onChange={handleChange} aria-label="Название" autoFocus />
          <select name="size" value={draft.size} onChange={handleChange} aria-label="Размер">
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input name="color" value={draft.color} onChange={handleChange} aria-label="Цвет" placeholder="цвет" />
          <input name="price" type="number" min="0.01" step="0.01" value={draft.price} onChange={handleChange} aria-label="Цена" />
          <input name="quantity" type="number" min="1" max="99" value={draft.quantity} onChange={handleChange} aria-label="Количество" />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="item-actions">
          <button type="button" className="btn btn-primary" onClick={save}>Сохранить</button>
          <button type="button" className="btn" onClick={onCancelEdit}>Отмена</button>
        </div>
      </li>
    );
  }

  return (
    <li className="cart-item">
      <div className="item-main">
        <span className="badge">{categoryLabel(item.category)}</span>
        <h3>{item.title}</h3>
        <p className="muted">
          Размер {item.size}{item.color ? ` · ${item.color}` : ''} · {formatPrice(item.price)} за шт.
        </p>
      </div>
      <div className="qty" aria-label="Количество">
        <button type="button" className="btn btn-icon" onClick={() => onChangeQuantity(item.id, -1)} disabled={item.quantity <= 1} aria-label="Уменьшить">−</button>
        <span>{item.quantity}</span>
        <button type="button" className="btn btn-icon" onClick={() => onChangeQuantity(item.id, 1)} disabled={item.quantity >= 99} aria-label="Увеличить">+</button>
      </div>
      <strong className="item-total">{formatPrice(item.price * item.quantity)}</strong>
      <div className="item-actions">
        <button type="button" className="btn" onClick={startEdit}>Изменить</button>
        <button type="button" className="btn btn-danger" onClick={() => onRemove(item.id)}>Удалить</button>
      </div>
    </li>
  );
}

// React.memo: строка перерисовывается только при изменении её собственных props.
export default memo(CartItemRow);
