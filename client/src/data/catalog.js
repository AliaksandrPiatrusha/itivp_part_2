// Справочники клиента. Категории совпадают с категориями товаров на сервере (лаб. №21–23);
// сами товары и корзина теперь загружаются из REST API.
export const CATEGORIES = [
  { value: 'tshirts', label: 'Футболки' },
  { value: 'jeans', label: 'Джинсы' },
  { value: 'hoodies', label: 'Худи' },
  { value: 'jackets', label: 'Куртки' },
  { value: 'shoes', label: 'Обувь' }
];

export const categoryLabel = value =>
  CATEGORIES.find(c => c.value === value)?.label ?? value;

// Максимум единиц одной позиции в корзине (ограничен также остатком на складе).
export const MAX_QUANTITY = 99;

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'BYN' });
export const formatPrice = value => money.format(value);
