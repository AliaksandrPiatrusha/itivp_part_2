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

export default function useCart(notify) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pending, setPending] = useState({});

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const controller = new AbortController();

    fetchCart(controller.signal)
      .then(data => {
        setItems(data.items);
        setStatus('ready');
      })
      .catch(error => {
        if (isCanceled(error)) return;
        setLoadError(getErrorMessage(error));
        setStatus('error');
      });

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => {
    setStatus('loading');
    setLoadError(null);
    setReloadKey(k => k + 1);
  }, []);

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

  const addItem = useCallback(async (product, size, quantity) => {
    const existing = itemsRef.current.find(i => i.productId === product.id && i.size === size);
    const tempId = `temp-${Date.now()}`;
    const key = existing ? existing.id : tempId;

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
      const data = await track(key, () => addCartItem({ productId: product.id, size, quantity }));
      replaceItem(key, data.item);
      notify('success', `«${product.title}» (${size}) добавлен в корзину`);
      return true;
    } catch (error) {
      setItems(prev => (existing
        ? prev.map(i => (i.id === existing.id ? { ...i, quantity: i.quantity - quantity } : i))
        : prev.filter(i => i.id !== tempId)));
      notify('error', `Не удалось добавить «${product.title}»: ${getErrorMessage(error)}`);
      return false;
    }
  }, [notify, track]);

  const updateItem = useCallback(async (id, changes) => {
    const before = itemsRef.current.find(i => i.id === id);
    if (!before) return false;

    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...changes } : i)));
    try {
      const data = await track(id, () => updateCartItem(id, changes));
      replaceItem(id, data.item);
      return true;
    } catch (error) {
      setItems(prev => prev.map(i => (i.id === id ? before : i)));
      notify('error', `Не удалось изменить «${before.title}»: ${getErrorMessage(error)}`);
      return false;
    }
  }, [notify, track]);

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
      if (getStatus(error) === 404) return true;
      setItems(prev => (prev.some(i => i.id === id)
        ? prev
        : [...prev.slice(0, index), removed, ...prev.slice(index)]));
      notify('error', `Не удалось удалить «${removed.title}»: ${getErrorMessage(error)}`);
      return false;
    }
  }, [notify, track]);

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
