import { useEffect, useRef, useState } from 'react';

// Имитация задержки ответа сервера при старте приложения.
const LOAD_DELAY_MS = 1000;
// Автосохранение срабатывает через 500 мс после последнего изменения (debounce).
const SAVE_DEBOUNCE_MS = 500;

const readStorage = key => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    // Повреждённый JSON или недоступное хранилище — считаем, что данных нет.
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/**
 * Состояние, синхронизированное с localStorage.
 * Вся работа с хранилищем вынесена сюда, чтобы в лаб. №5 заменить её на REST API,
 * не трогая компоненты.
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  // Последнее записанное в хранилище значение и время записи.
  const [saved, setSaved] = useState({ value: undefined, at: null, error: false });

  // Актуальные значения для обработчика beforeunload и эффекта загрузки.
  const latest = useRef({ key, value, initialValue });
  useEffect(() => {
    latest.current = { key, value, initialValue };
  });

  // Загрузка при монтировании: данные из localStorage или стартовый набор.
  useEffect(() => {
    const timer = setTimeout(() => {
      const { key: storageKey, initialValue: fallback } = latest.current;
      const stored = readStorage(storageKey);
      setValue(Array.isArray(fallback) && !Array.isArray(stored) ? fallback : stored ?? fallback);
      setIsLoading(false);
    }, LOAD_DELAY_MS);

    // Очистка: при размонтировании (и при двойном запуске в StrictMode) таймер отменяется.
    return () => clearTimeout(timer);
  }, []);

  // Сохранение при каждом изменении данных с задержкой 500 мс.
  useEffect(() => {
    if (isLoading) return undefined;

    const timer = setTimeout(() => {
      if (writeStorage(key, value)) setSaved({ value, at: new Date(), error: false });
      else setSaved(prev => ({ ...prev, error: true }));
    }, SAVE_DEBOUNCE_MS);

    // Новое изменение до истечения 500 мс отменяет предыдущий таймер.
    return () => clearTimeout(timer);
  }, [key, value, isLoading]);

  // Если страницу закрывают раньше, чем сработал debounce, сохраняем немедленно.
  useEffect(() => {
    if (isLoading) return undefined;
    const flush = () => writeStorage(latest.current.key, latest.current.value);
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [isLoading]);

  // Статус вычисляется при рендере: данные отличаются от записанных — значит, ждём debounce.
  let saveStatus = 'idle';
  if (!isLoading) {
    if (saved.error) saveStatus = 'error';
    else saveStatus = saved.value === value ? 'saved' : 'pending';
  }

  return { value, setValue, isLoading, saveStatus, lastSavedAt: saved.at };
}
