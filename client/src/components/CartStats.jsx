import { formatPrice } from '../data/catalog';

export default function CartStats({ stats, isLoading, isSyncing, onClear }) {
  return (
    <div className="card stats">
      <div className="list-header">
        <h2>Итого</h2>
        <span className={`save-status ${isSyncing ? '' : 'save-saved'}`} aria-live="polite">
          {isLoading ? '' : isSyncing ? <><span className="spinner spinner-sm" /> Сохранение…</> : 'Синхронизировано'}
        </span>
      </div>
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
