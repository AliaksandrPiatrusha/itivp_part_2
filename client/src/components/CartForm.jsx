import { useEffect, useState } from 'react';
import { fetchProducts, getErrorMessage, isCanceled } from '../api';
import { CATEGORIES, categoryLabel, formatPrice } from '../data/catalog';
import useDebounce from '../hooks/useDebounce';
import validateItem, { quantityLimit } from '../utils/validateItem';

const SEARCH_DEBOUNCE_MS = 400;

const defaultSize = sizes => (sizes.includes('M') ? 'M' : sizes[0] ?? '');

/**
 * Добавление товара в корзину: поиск по каталогу на сервере (GET /api/products?search=)
 * с debounce ввода и отменой устаревших запросов, затем выбор размера и количества.
 */
export default function CartForm({ onAdd }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  // Результат последнего завершённого запроса и «ключ» параметров, для которых он получен.
  const [result, setResult] = useState({ key: null, products: [], error: null });

  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState(null);

  // Запрос уходит только через 400 мс после последнего нажатия клавиши.
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const requestKey = `${debouncedSearch}|${category}|${reloadKey}`;

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts({ search: debouncedSearch, category }, controller.signal)
      .then(products => setResult({ key: requestKey, products, error: null }))
      .catch(err => {
        if (!isCanceled(err)) setResult({ key: requestKey, products: [], error: getErrorMessage(err) });
      });
    // Параметры поиска изменились или компонент размонтирован — прерываем устаревший запрос,
    // чтобы его ответ не перезаписал более свежий результат.
    return () => controller.abort();
  }, [debouncedSearch, category, reloadKey, requestKey]);

  // Загрузка и ожидание debounce вычисляются из состояния, а не хранятся отдельно.
  const isLoading = result.key !== requestKey;
  const isTyping = search.trim() !== debouncedSearch;
  const { products, error: loadError } = result;

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
          {isTyping ? 'Ввод…' : isLoading ? 'Поиск на сервере…' : loadError ? '' : `Найдено: ${products.length}`}
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
