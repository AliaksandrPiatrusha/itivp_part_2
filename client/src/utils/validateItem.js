// Проверка полей позиции корзины; возвращает текст ошибки или null.
export default function validateItem({ title, price, quantity }) {
  if (!String(title).trim()) return 'Введите название товара';
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) return 'Цена должна быть положительным числом';
  const q = Number(quantity);
  if (!Number.isInteger(q) || q < 1 || q > 99) return 'Количество — целое число от 1 до 99';
  return null;
}
