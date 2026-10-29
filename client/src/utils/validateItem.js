import { MAX_QUANTITY } from '../data/catalog';

export const quantityLimit = stock =>
  Number.isInteger(stock) ? Math.min(MAX_QUANTITY, Math.max(stock, 0)) : MAX_QUANTITY;

export default function validateItem({ size, sizes, quantity, stock }) {
  if (!size) return 'Выберите размер';
  if (sizes && !sizes.includes(size)) return `Размер ${size} недоступен для этого товара`;
  const q = Number(quantity);
  const max = quantityLimit(stock);
  if (max === 0) return 'Товара нет на складе';
  if (!Number.isInteger(q) || q < 1 || q > max) return `Количество — целое число от 1 до ${max}`;
  return null;
}
