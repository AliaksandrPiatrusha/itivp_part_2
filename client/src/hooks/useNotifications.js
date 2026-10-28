import { useCallback, useState } from 'react';

let nextId = 1;

/** Очередь всплывающих уведомлений (успех / ошибка). Автоскрытие — в компоненте Toasts. */
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((type, text) => {
    const id = nextId++;
    // Храним не более 4 последних уведомлений.
    setNotifications(prev => [...prev.slice(-3), { id, type, text }]);
  }, []);

  const dismiss = useCallback(id => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, notify, dismiss };
}
