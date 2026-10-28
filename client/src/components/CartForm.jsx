import { useEffect, useRef, useState } from 'react';
import { fetchProducts, getErrorMessage, isCanceled } from '../api';
import { CATEGORIES, categoryLabel, formatPrice } from '../data/catalog';
import useDebounce from '../hooks/useDebounce';
import validateItem, { quantityLimit } from '../utils/validateItem';

const SEARCH_DEBOUNCE_MS = 400;
// Сколько товаров каталога загружается за один запрос.
const PAGE_SIZE = 6;

const defaultSize = sizes => (sizes.includes('M') ? 'M' : sizes[0] ?? '');

/**
 * Добавление товара в корзину: поиск по каталогу на сервере (GET /api/products?search=)
 * с debounce ввода и отменой устаревших запросов, постраничная загрузка (limit/offset)
 * с кнопкой «Показать ещё», затем выбор размера и количества.
 */
export default function CartForm({ onAdd }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  // Загруженные страницы каталога и «ключ» параметров поиска, для которых они получены.
  const [result, setResult] = useState({ key: null, products: [], total: 0, error: null });
  // Состояние догрузки следующей страницы (тоже привязано к ключу параметров).
  const [more, setMore] = useState({ key: null, loading: false, error: null });
  const moreControllerRef = useRef(null);

  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState(null);

  // Запрос уходит только через 400 мс после последнего нажатия клавиши.
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const requestKey = `${debouncedSearch}|${category}|${reloadKey}`;

  // Первая страница: загружается заново при каждом изменении параметров поиска.
  useEffect(() => {
    const controller = new AbortController();
    fetchProducts({ search: debouncedSearch, category, limit: PAGE_SIZE, offset: 0 }, controller.signal)
      .then(({ items, total }) => setResult({ key: requestKey, products: items, total, error: null }))
      .catch(err => {
        if (!isCanceled(err)) setResult({ key: requestKey, products: [], total: 0, error: getErrorMessage(err) });
      });
    // Параметры поиска изменились или компонент размонтирован — прерываем устаревшие запросы
    // (и первой страницы, и догрузки), чтобы их ответы не перезаписали более свежий результат.
    return () => {
      controller.abort();
      moreControllerRef.current?.abort();
    };
  }, [debouncedSearch, category, reloadKey, requestKey]);

  // Загрузка и ожидание debounce вычисляются из состояния, а не хранятся отдельно.
  const isLoading = result.key !== requestKey;
  const isTyping = search.trim() !== debouncedSearch;
  const { products, total, error: loadError } = result;
  const isLoadingMore = more.key === requestKey && more.loading;
  const moreError = more.key === requestKey ? more.error : null;
  const hasMore = !isLoading && products.length < total;

  // «Показать ещё»: следующая страница начинается с offset = числу уже загруженных товаров.
  const loadMore = () => {
    const key = requestKey;
    const controller = new AbortController();
    moreControllerRef.current = controller;
    setMore({ key, loading: true, error: null });

    fetchProducts(
      { search: debouncedSearch, category, limit: PAGE_SIZE, offset: products.length },
      controller.signal
    )
      .then(({ items, total: newTotal }) => {
        setResult(prev => {
          if (prev.key !== key) return prev;
          // Защита от дублей, если каталог изменился между запросами.
          const known = new Set(prev.products.map(p => p.id));
          return { ...prev, products: [...prev.products, ...items.filter(p => !known.has(p.id))], total: newTotal };
        });
        setMore({ key, loading: false, error: null });
      })
      .catch(err => {
        if (!isCanceled(err)) setMore({ key, loading: false, error: getErrorMessage(err) });
      });
  };

  const selectProduct = product => {
    setSelected(product);
    setSize(defaultSize(product.sizes));
    setQuantity('1');
    setError(null);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!selected) {
      setError('Выберите товар из каталога');
      return;
    }
    const message = validateItem({ size, sizes: selected.sizes, quantity, stock: selected.stock });
    if (message) {
      setError(message);
      return;
    }
    // Оптимистичное добавление: форма сразу готова к следующему товару, ответ сервера не ждём.
    onAdd(selected, size, Number(quantity));
    setQuantity('1');
  };

  const max = selected ? quantityLimit(selected.stock) : 1;

  return (
    <div className="card cart-form">
      <div className="list-header">
        <h2>Добавить товар</h2>
        <span className="save-status" aria-live="polite">
          {isTyping ? 'Ввод…' : isLoading ? 'Поиск на сервере…' : loadError ? '' : `Показано ${products.length} из ${total}`}
        </span>
      </div>

      <div className="toolbar toolbar-2">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск в каталоге по названию или цвету"
          aria-label="Поиск в каталоге"
        />
        <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Категория каталога">
          <option value="all">Все категории</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loadError && !isLoading ? (
        <div className="placeholder placeholder-error">
          <span>{loadError}</span>
          <button type="button" className="btn" onClick={() => setReloadKey(k => k + 1)}>Повторить</button>
        </div>
      ) : products.length === 0 && !isLoading ? (
        <p className="placeholder">
          {debouncedSearch ? `По запросу «${debouncedSearch}» ничего не найдено.` : 'В этой категории нет товаров.'}
        </p>
      ) : (
        <ul className={`catalog ${isLoading ? 'is-loading' : ''}`} aria-busy={isLoading}>
          {products.map(p => (
            <li key={p.id}>
              <button
                type="button"
                className={`product ${selected?.id === p.id ? 'selected' : ''}`}
                onClick={() => selectProduct(p)}
                disabled={p.stock < 1}
                aria-pressed={selected?.id === p.id}
              >
                <span className="badge">{categoryLabel(p.category)}</span>
                <strong>{p.title}</strong>
                <span className="muted">{p.color || 'цвет не указан'} · {p.sizes.join(', ')}</span>
                <span className="product-price">
                  {formatPrice(p.price)}
                  <span className="muted">{p.stock > 0 ? `в наличии ${p.stock}` : 'нет в наличии'}</span>
                </span>
              </button>
            </li>
          ))}
          {isLoading && products.length === 0 && (
            <li className="placeholder"><span className="spinner" aria-hidden="true" />Загрузка каталога…</li>
          )}
        </ul>
      )}

      {(hasMore || moreError) && !loadError && (
        <div className="load-more">
          {moreError && <span className="error">{moreError}</span>}
          <button type="button" className="btn" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore && <span className="spinner spinner-sm" aria-hidden="true" />}
            {isLoadingMore
              ? 'Загрузка…'
              : moreError
                ? 'Повторить'
                : `Показать ещё (осталось ${total - products.length})`}
          </button>
        </div>
      )}

      <form className="add-form" onSubmit={handleSubmit} noValidate>
        <p className="add-form-title">
          {selected ? <>Выбран: <strong>{selected.title}</strong> · {formatPrice(selected.price)}</> : 'Товар не выбран'}
        </p>
        <label className="field">
          <span>Размер</span>
          <select value={size} onChange={e => { setSize(e.target.value); setError(null); }} disabled={!selected}>
            {(selected?.sizes ?? []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Кол-во</span>
          <input
            type="number"
            min="1"
            max={max}
            value={quantity}
            onChange={e => { setQuantity(e.target.value); setError(null); }}
            disabled={!selected}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={!selected}>Добавить в корзину</button>
      </form>
      <p className="error" role="alert">{error}</p>
    </div>
  );
}
