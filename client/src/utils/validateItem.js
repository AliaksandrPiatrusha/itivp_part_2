import { MAX_QUANTITY } from '../data/catalog';

// Верхняя граница количества для позиции: остаток на складе, но не больше MAX_QUANTITY.
export const quantityLimit = stock =>
  Number.isInteger(stock) ? Math.min(MAX_QUANTITY, Math.max(stock, 0)) : MAX_QUANTITY;

// Проверка выбора товара перед отправкой на сервер; возвращает текст ошибки или null.
export default function validateItem({ size, sizes, quantity, stock }) {
  if (!size) return 'Выберите размер';
  if (sizes && !sizes.includes(size)) return `Размер ${size} недоступен для этого товара`;
  const q = Number(quantity);
  const max = quantityLimit(stock);
  if (max === 0) return 'Товара нет на складе';
  if (!Number.isInteger(q) || q < 1 || q > max) return `Количество — целое число от 1 до ${max}`;
  return null;
}
