// Справочники и стартовые данные корзины интернет-магазина одежды.
// Категории совпадают с категориями товаров серверной части (лаб. №21–23).

export const CATEGORIES = [
  { value: 'tshirts', label: 'Футболки' },
  { value: 'jeans', label: 'Джинсы' },
  { value: 'hoodies', label: 'Худи' },
  { value: 'jackets', label: 'Куртки' },
  { value: 'shoes', label: 'Обувь' }
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const categoryLabel = value =>
  CATEGORIES.find(c => c.value === value)?.label ?? value;

// Используются, когда в localStorage ещё ничего нет.
export const INITIAL_CART = [
  {
    id: 'demo-1',
    title: 'Футболка Oversize',
    category: 'tshirts',
    size: 'M',
    color: 'чёрный',
    price: 39.9,
    quantity: 2,
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'demo-2',
    title: 'Джинсы Slim Fit',
    category: 'jeans',
    size: 'L',
    color: 'синий',
    price: 89,
    quantity: 1,
    createdAt: '2026-10-02T10:00:00.000Z'
  },
  {
    id: 'demo-3',
    title: 'Худи Basic',
    category: 'hoodies',
    size: 'XL',
    color: 'серый',
    price: 74.5,
    quantity: 1,
    createdAt: '2026-10-03T10:00:00.000Z'
  }
];

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'BYN' });
export const formatPrice = value => money.format(value);
