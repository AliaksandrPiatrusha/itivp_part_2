import { useCallback, useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { CATEGORIES, INITIAL_CART, formatPrice } from '../data/catalog';
import CartForm from './CartForm';
import CartItemRow from './CartItemRow';
import CartStats from './CartStats';

const STORAGE_KEY = 'clothing-store:cart';

const SORTS = {
  newest: { label: 'Сначала новые', compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  title: { label: 'По названию (А–Я)', compare: (a, b) => a.title.localeCompare(b.title, 'ru') },
  'price-asc': { label: 'Цена ↑', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Цена ↓', compare: (a, b) => b.price - a.price },
  'total-desc': { label: 'Сумма позиции ↓', compare: (a, b) => b.price * b.quantity - a.price * a.quantity }
};

const SAVE_LABELS = {
  idle: '',
  pending: 'Сохранение…',
  saved: 'Сохранено',
  error: 'Не удалось сохранить'
};

/** Корзина интернет-магазина одежды: список позиций, фильтры, сортировка, статистика. */
export default function CartList() {
  const { value: items, setValue: setItems, isLoading, saveStatus, lastSavedAt } =
    useLocalStorage(STORAGE_KEY, INITIAL_CART);

  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [editingId, setEditingId] = useState(null);

  // Заголовок вкладки отражает состояние корзины; при размонтировании возвращается исходный.
  useEffect(() => {
    const previous = document.title;
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    document.title = isLoading ? 'Загрузка корзины…' : `Корзина (${count}) — Магазин одежды`;
    return () => {
      document.title = previous;
    };
  }, [items, isLoading]);

  // Добавление: тот же товар того же размера и цвета увеличивает количество, а не дублируется.
  const handleAdd = useCallback(newItem => {
    setItems(prev => {
      const same = prev.find(i =>
        i.title.toLowerCase() === newItem.title.toLowerCase() &&
        i.size === newItem.size &&
        i.color.toLowerCase() === newItem.color.toLowerCase()
      );
      if (same) {
        return prev.map(i =>
          i.id === same.id ? { ...i, quantity: Math.min(99, i.quantity + newItem.quantity), price: newItem.price } : i
        );
      }
      return [...prev, { ...newItem, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
    });
  }, [setItems]);

  const handleRemove = useCallback(id => {
    setItems(prev => prev.filter(i => i.id !== id));
    setEditingId(current => (current === id ? null : current));
  }, [setItems]);

  const handleSave = useCallback((id, changes) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...changes } : i)));
    setEditingId(null);
  }, [setItems]);

  const handleChangeQuantity = useCallback((id, delta) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: Math.min(99, Math.max(1, i.quantity + delta)) } : i
    ));
  }, [setItems]);

  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  const handleClear = () => {
    if (window.confirm('Удалить все товары из корзины?')) {
      setItems([]);
      setEditingId(null);
    }
  };

  const resetFilters = () => {
    setCategory('all');
    setSearch('');
    setSort('newest');
  };

  // Фильтрация и сортировка пересчитываются только при изменении входных данных.
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter(i => category === 'all' || i.category === category)
      .filter(i => !query || i.title.toLowerCase().includes(query) || i.color.toLowerCase().includes(query))
      .sort(SORTS[sort].compare);
  }, [items, category, search, sort]);

  const stats = useMemo(() => {
    const units = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const visibleTotal = visibleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { positions: items.length, units, total, visibleTotal, average: units ? total / units : 0 };
  }, [items, visibleItems]);

  const isFiltered = category !== 'all' || search.trim() !== '';

  return (
    <div className="layout">
      <section className="main-column">
        <CartForm onAdd={handleAdd} />

        <div className="card">
          <div className="list-header">
            <h2>Корзина</h2>
            <span className={`save-status save-${saveStatus}`} aria-live="polite">
              {SAVE_LABELS[saveStatus]}
              {saveStatus === 'saved' && lastSavedAt && ` в ${lastSavedAt.toLocaleTimeString('ru-RU')}`}
            </span>
          </div>

          <div className="toolbar">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию или цвету"
              aria-label="Поиск"
            />
            <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Категория">
              <option value="all">Все категории</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Сортировка">
              {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="placeholder">
              <span className="spinner" aria-hidden="true" />
              Загрузка корзины с сервера…
            </div>
          ) : items.length === 0 ? (
            <p className="placeholder">Корзина пуста — добавьте товар с помощью формы выше.</p>
          ) : visibleItems.length === 0 ? (
            <p className="placeholder">
              Ничего не найдено. <button type="button" className="link" onClick={resetFilters}>Сбросить фильтры</button>
            </p>
          ) : (
            <ul className="cart-items">
              {visibleItems.map(item => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  onStartEdit={setEditingId}
                  onCancelEdit={handleCancelEdit}
                  onSave={handleSave}
                  onRemove={handleRemove}
                  onChangeQuantity={handleChangeQuantity}
                />
              ))}
            </ul>
          )}

          {!isLoading && isFiltered && visibleItems.length > 0 && (
            <p className="muted filter-summary">
              Показано {visibleItems.length} из {items.length} · на сумму {formatPrice(stats.visibleTotal)}
            </p>
          )}
        </div>
      </section>

      <aside className="side-column">
        <CartStats stats={stats} isLoading={isLoading} onClear={handleClear} />
      </aside>
    </div>
  );
}
