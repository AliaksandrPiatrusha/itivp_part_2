import { memo, useState } from 'react';
import { categoryLabel, formatPrice } from '../data/catalog';
import validateItem, { quantityLimit } from '../utils/validateItem';

/**
 * Строка корзины: изменение количества (−/+), редактирование размера и количества, удаление.
 * Пока по позиции идёт запрос к серверу (isPending), действия заблокированы и показан спиннер.
 */
function CartItemRow({ item, isEditing, isPending, onStartEdit, onCancelEdit, onUpdate, onRemove }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);

  const max = quantityLimit(item.stock);
  const locked = isPending || item.isTemp;

  const startEdit = () => {
    setDraft({ size: item.size, quantity: String(item.quantity) });
    setError(null);
    onStartEdit(item.id);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const save = () => {
    const message = validateItem({ ...draft, sizes: item.sizes, stock: item.stock });
    if (message) {
      setError(message);
      return;
    }
    // На сервер уходят только реально изменённые поля.
    const changes = {};
    if (draft.size !== item.size) changes.size = draft.size;
    if (Number(draft.quantity) !== item.quantity) changes.quantity = Number(draft.quantity);
    onCancelEdit();
    if (Object.keys(changes).length > 0) onUpdate(item.id, changes);
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
        <div className="item-main">
          <h3>{item.title}</h3>
          <p className="muted">{formatPrice(item.price)} за шт. · на складе {item.stock ?? '—'}</p>
        </div>
        <div className="edit-grid">
          <label className="field">
            <span>Размер</span>
            <select name="size" value={draft.size} onChange={handleChange} autoFocus>
              {item.sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Кол-во</span>
            <input name="quantity" type="number" min="1" max={max} value={draft.quantity} onChange={handleChange} />
          </label>
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
    <li className={`cart-item ${locked ? 'pending' : ''}`} aria-busy={locked}>
      <div className="item-main">
        <span className="badge">{categoryLabel(item.category)}</span>
        <h3>
          {item.title}
          {locked && <span className="spinner spinner-sm" title="Синхронизация с сервером" />}
        </h3>
        <p className="muted">
          Размер {item.size}{item.color ? ` · ${item.color}` : ''} · {formatPrice(item.price)} за шт.
          {item.isTemp && ' · сохраняется…'}
        </p>
      </div>
      <div className="qty" aria-label="Количество">
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => onUpdate(item.id, { quantity: item.quantity - 1 })}
          disabled={locked || item.quantity <= 1}
          aria-label="Уменьшить"
        >−</button>
        <span>{item.quantity}</span>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
          disabled={locked || item.quantity >= max}
          aria-label="Увеличить"
        >+</button>
      </div>
      <strong className="item-total">{formatPrice(item.price * item.quantity)}</strong>
      <div className="item-actions">
        <button type="button" className="btn" onClick={startEdit} disabled={locked}>Изменить</button>
        <button type="button" className="btn btn-danger" onClick={() => onRemove(item.id)} disabled={locked}>Удалить</button>
      </div>
    </li>
  );
}

// React.memo: строка перерисовывается только при изменении её собственных props.
export default memo(CartItemRow);
