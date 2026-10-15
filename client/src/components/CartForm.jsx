import { useState } from 'react';
import { CATEGORIES, SIZES } from '../data/catalog';
import validateItem from '../utils/validateItem';

const EMPTY_FORM = { title: '', category: 'tshirts', size: 'M', color: '', price: '', quantity: '1' };

/** Форма добавления позиции в корзину (контролируемые поля). */
export default function CartForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    // Обновление на основе предыдущего состояния.
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Enter в любом поле отправляет форму — стандартное поведение <form onSubmit>.
  const handleSubmit = e => {
    e.preventDefault();
    const message = validateItem(form);
    if (message) {
      setError(message);
      return;
    }
    onAdd({
      title: form.title.trim(),
      category: form.category,
      size: form.size,
      color: form.color.trim(),
      price: Math.round(Number(form.price) * 100) / 100,
      quantity: Number(form.quantity)
    });
    setForm(prev => ({ ...EMPTY_FORM, category: prev.category }));
  };

  return (
    <form className="card cart-form" onSubmit={handleSubmit} noValidate>
      <h2>Добавить товар</h2>
      <div className="form-grid">
        <label className="field field-wide">
          <span>Название</span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Например, Куртка Parka"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Категория</span>
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Размер</span>
          <select name="size" value={form.size} onChange={handleChange}>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Цвет</span>
          <input name="color" value={form.color} onChange={handleChange} placeholder="белый" />
        </label>
        <label className="field">
          <span>Цена, BYN</span>
          <input
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onChange={handleChange}
            placeholder="0.00"
          />
        </label>
        <label className="field">
          <span>Кол-во</span>
          <input
            name="quantity"
            type="number"
            min="1"
            max="99"
            value={form.quantity}
            onChange={handleChange}
          />
        </label>
      </div>
      <div className="form-footer">
        <p className="error" role="alert">{error}</p>
        <button type="submit" className="btn btn-primary">Добавить в корзину</button>
      </div>
    </form>
  );
}
