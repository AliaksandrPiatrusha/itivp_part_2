import { useCallback, useEffect, useMemo, useState } from 'react';
import useCart from '../hooks/useCart';
import { CATEGORIES, formatPrice } from '../data/catalog';
import CartForm from './CartForm';
import CartItemRow from './CartItemRow';
import CartStats from './CartStats';

const SORTS = {
  newest: { label: 'Сначала новые', compare: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) },
  title: { label: 'По названию (А–Я)', compare: (a, b) => a.title.localeCompare(b.title, 'ru') },
  'price-asc': { label: 'Цена ↑', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Цена ↓', compare: (a, b) => b.price - a.price },
  'total-desc': { label: 'Сумма позиции ↓', compare: (a, b) => b.price * b.quantity - a.price * a.quantity }
};

/** Корзина интернет-магазина одежды, синхронизированная с REST API. */
export default function CartList({ notify }) {
  const { items, status, loadError, reload, pending, isSyncing, addItem, updateItem, removeItem, clear } =
    useCart(notify);

  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [editingId, setEditingId] = useState(null);

  const isLoading = status === 'loading';

  // Заголовок вкладки отражает состояние корзины; при размонтировании возвращается исходный.
  useEffect(() => {
    const previous = document.title;
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    document.title = isLoading ? 'Загрузка корзины…' : `Корзина (${count}) — Магазин одежды`;
    return () => {
      document.title = previous;
    };
  }, [items, isLoading]);

  const handleRemove = useCallback(id => {
    setEditingId(current => (current === id ? null : current));
    removeItem(id);
  }, [removeItem]);

  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  const handleClear = () => {
    if (window.confirm('Удалить все товары из корзины?')) {
      setEditingId(null);
      clear();
    }
  };

  const resetFilters = () => {
    setCategory('all');
    setSearch('');
    setSort('newest');
  };

  // Фильтрация и сортировка уже загруженной корзины выполняются на клиенте.
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter(i => category === 'all' || i.category === category)
      .filter(i => !query || i.title.toLowerCase().includes(query) || (i.color || '').toLowerCase().includes(query))
      .sort(SORTS[sort].compare);
  }, [items, category, search, sort]);

  const stats = useMemo(() => {
    const units = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const visibleTotal = visibleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { positions: items.length, units, total, visibleTotal, average: units ? total / units : 0 };
  }, [items, visibleItems]);

  const isFiltered = category !== 'all' || search.trim() !== '';

  let content;
  if (isLoading) {
    content = (
      <div className="placeholder">
        <span className="spinner" aria-hidden="true" />
        Загрузка корзины с сервера…
      </div>
    );
  } else if (status === 'error') {
    content = (
      <div className="placeholder placeholder-error" role="alert">
        <span>Не удалось загрузить корзину. {loadError}</span>
        <button type="button" className="btn btn-primary" onClick={reload}>Повторить</button>
      </div>
    );
  } else if (items.length === 0) {
    content = <p className="placeholder">Корзина пуста — найдите товар в каталоге выше.</p>;
  } else if (visibleItems.length === 0) {
    content = (
      <p className="placeholder">
        Ничего не найдено. <button type="button" className="link" onClick={resetFilters}>Сбросить фильтры</button>
      </p>
    );
  } else {
    content = (
      <ul className="cart-items">
        {visibleItems.map(item => (
          <CartItemRow
            key={item.id}
            item={item}
            isEditing={editingId === item.id}
            isPending={Boolean(pending[item.id])}
            onStartEdit={setEditingId}
            onCancelEdit={handleCancelEdit}
            onUpdate={updateItem}
            onRemove={handleRemove}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="layout">
      <section className="main-column">
        <CartForm onAdd={addItem} />

        <div className="card">
          <div className="list-header">
            <h2>Корзина</h2>
            {status === 'ready' && (
              <button type="button" className="link" onClick={reload} disabled={isSyncing}>Обновить</button>
            )}
          </div>

          <div className="toolbar">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск в корзине по названию или цвету"
              aria-label="Поиск в корзине"
            />
            <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Категория">
              <option value="all">Все категории</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Сортировка">
              {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </select>
          </div>

          {content}

          {status === 'ready' && isFiltered && visibleItems.length > 0 && (
            <p className="muted filter-summary">
              Показано {visibleItems.length} из {items.length} · на сумму {formatPrice(stats.visibleTotal)}
            </p>
          )}
        </div>
      </section>

      <aside className="side-column">
        <CartStats stats={stats} isLoading={status !== 'ready'} isSyncing={isSyncing} onClear={handleClear} />
      </aside>
    </div>
  );
}
