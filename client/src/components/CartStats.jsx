import { formatPrice } from '../data/catalog';

/** Итоги корзины: количество позиций и единиц, средняя цена, общая сумма. */
export default function CartStats({ stats, isLoading, onClear }) {
  return (
    <div className="card stats">
      <h2>Итого</h2>
      <dl>
        <div><dt>Позиций</dt><dd>{isLoading ? '—' : stats.positions}</dd></div>
        <div><dt>Единиц товара</dt><dd>{isLoading ? '—' : stats.units}</dd></div>
        <div><dt>Средняя цена</dt><dd>{isLoading ? '—' : formatPrice(stats.average)}</dd></div>
        <div className="total"><dt>К оплате</dt><dd>{isLoading ? '—' : formatPrice(stats.total)}</dd></div>
      </dl>
      <button
        type="button"
        className="btn btn-danger btn-block"
        onClick={onClear}
        disabled={isLoading || stats.positions === 0}
      >
        Очистить корзину
      </button>
    </div>
  );
}
