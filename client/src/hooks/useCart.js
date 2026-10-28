import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  fetchCart,
  getErrorMessage,
  getStatus,
  isCanceled,
  updateCartItem
} from '../api';

/**
 * Корзина, синхронизированная с сервером (заменяет useLocalStorage из лаб. №24).
 *
 * - GET /api/cart при монтировании и по кнопке «Повторить», запрос отменяется при размонтировании;
 * - POST/PUT/DELETE с оптимистичным обновлением: интерфейс меняется сразу,
 *   при ошибке сервера изменение откатывается и показывается уведомление.
 */
export default function useCart(notify) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Позиции, по которым сейчас выполняется фоновый запрос: { [id]: число запросов }.
  const [pending, setPending] = useState({});

  // Актуальный список для обработчиков: из него берутся снимки для отката.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /* ---------- Загрузка (GET) ---------- */

  useEffect(() => {
    const controller = new AbortController();

    fetchCart(controller.signal)
      .then(data => {
        setItems(data.items);
        setStatus('ready');
      })
      .catch(error => {
        // Отмена при размонтировании — не ошибка, состояние уже никому не нужно.
        if (isCanceled(error)) return;
        setLoadError(getErrorMessage(error));
        setStatus('error');
      });

    // Очистка: AbortController прерывает незавершённый запрос.
    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => {
    setStatus('loading');
    setLoadError(null);
    setReloadKey(k => k + 1);
  }, []);

  /* ---------- Учёт фоновых запросов ---------- */

  const track = useCallback(async (id, request) => {
    setPending(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    try {
      return await request();
    } finally {
      setPending(prev => {
        const next = { ...prev };
        if (next[id] > 1) next[id] -= 1;
        else delete next[id];
        return next;
      });
    }
  }, []);

  const replaceItem = (id, item) =>
    setItems(prev => prev.map(i => (i.id === id && item ? item : i)));

  /* ---------- Добавление (POST) ---------- */

  const addItem = useCallback(async (product, size, quantity) => {
    const existing = itemsRef.current.find(i => i.productId === product.id && i.size === size);
    // Временный ID, пока сервер не вернул настоящий.
    const tempId = `temp-${Date.now()}`;
    const key = existing ? existing.id : tempId;

    // 1. Оптимистично меняем состояние: увеличиваем количество или добавляем новую позицию.
    if (existing) {
      setItems(prev => prev.map(i => (i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i)));
    } else {
      setItems(prev => [...prev, {
        id: tempId,
        productId: product.id,
        title: product.title,
        category: product.category,
        color: product.color,
        sizes: product.sizes,
        stock: product.stock,
        size,
        price: Number(product.price),
        quantity,
        createdAt: new Date().toISOString(),
        isTemp: true
      }]);
    }

    try {
      // 2. Отправляем POST-запрос.
      const data = await track(key, () => addCartItem({ productId: product.id, size, quantity }));
      // 3. Успех: временная запись заменяется позицией из ответа сервера (с реальным id).
      replaceItem(key, data.item);
      notify('success', `«${product.title}» (${size}) добавлен в корзину`);
      return true;
    } catch (error) {
      // 4. Ошибка: откатываем изменение и сообщаем пользователю.
      setItems(prev => (existing
        ? prev.map(i => (i.id === existing.id ? { ...i, quantity: i.quantity - quantity } : i))
        : prev.filter(i => i.id !== tempId)));
      notify('error', `Не удалось добавить «${product.title}»: ${getErrorMessage(error)}`);
      return false;
    }
  }, [notify, track]);

  /* ---------- Редактирование (PUT) ---------- */

  const updateItem = useCallback(async (id, changes) => {
    const before = itemsRef.current.find(i => i.id === id);
    if (!before) return false;

    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...changes } : i)));
    try {
      const data = await track(id, () => updateCartItem(id, changes));
      replaceItem(id, data.item);
      return true;
    } catch (error) {
      // Откат к снимку позиции до изменения.
      setItems(prev => prev.map(i => (i.id === id ? before : i)));
      notify('error', `Не удалось изменить «${before.title}»: ${getErrorMessage(error)}`);
      return false;
    }
  }, [notify, track]);

  /* ---------- Удаление (DELETE) ---------- */

  const removeItem = useCallback(async id => {
    const index = itemsRef.current.findIndex(i => i.id === id);
    if (index === -1) return false;
    const removed = itemsRef.current[index];

    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await track(id, () => deleteCartItem(id));
      notify('success', `«${removed.title}» удалён из корзины`);
      return true;
    } catch (error) {
      // 404 — позиции на сервере уже нет, значит удаление фактически выполнено.
      if (getStatus(error) === 404) return true;
      // Возвращаем позицию на прежнее место.
      setItems(prev => (prev.some(i => i.id === id)
        ? prev
        : [...prev.slice(0, index), removed, ...prev.slice(index)]));
      notify('error', `Не удалось удалить «${removed.title}»: ${getErrorMessage(error)}`);
      return false;
    }
  }, [notify, track]);

  /* ---------- Очистка корзины (DELETE /cart) ---------- */

  const clear = useCallback(async () => {
    const snapshot = itemsRef.current;
    setItems([]);
    try {
      await track('all', clearCart);
      notify('success', 'Корзина очищена');
      return true;
    } catch (error) {
      setItems(snapshot);
      notify('error', `Не удалось очистить корзину: ${getErrorMessage(error)}`);
      return false;
    }
  }, [notify, track]);

  return {
    items,
    status,
    loadError,
    reload,
    pending,
    isSyncing: Object.keys(pending).length > 0,
    addItem,
    updateItem,
    removeItem,
    clear
  };
}
