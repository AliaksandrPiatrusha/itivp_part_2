import { useEffect, useState } from 'react';

/** Возвращает value, обновлённое только после delay мс без изменений (debounce). */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // Новое изменение до истечения задержки отменяет предыдущий таймер.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
