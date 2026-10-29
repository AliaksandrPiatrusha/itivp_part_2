export const CATEGORIES = [
  { value: 'tshirts', label: 'Футболки' },
  { value: 'jeans', label: 'Джинсы' },
  { value: 'hoodies', label: 'Худи' },
  { value: 'jackets', label: 'Куртки' },
  { value: 'shoes', label: 'Обувь' }
];

export const categoryLabel = value =>
  CATEGORIES.find(c => c.value === value)?.label ?? value;

export const MAX_QUANTITY = 99;

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'BYN' });
export const formatPrice = value => money.format(value);
