const products = [
  { id: 1, title: 'Футболка Oversize', category: 'tshirts', sizes: ['S', 'M', 'L'], color: 'чёрный', price: 39.9, stock: 25 },
  { id: 2, title: 'Джинсы Slim Fit', category: 'jeans', sizes: ['M', 'L', 'XL'], color: 'синий', price: 89.0, stock: 14 },
  { id: 3, title: 'Худи Basic', category: 'hoodies', sizes: ['S', 'M', 'L', 'XL'], color: 'серый', price: 74.5, stock: 8 }
];

let nextId = 4;

const findAll = ({ category, size, maxPrice } = {}) =>
  products.filter(p =>
    (!category || p.category === category) &&
    (!size || p.sizes.includes(size)) &&
    (!maxPrice || p.price <= Number(maxPrice))
  );

const findById = id => products.find(p => p.id === id) || null;

const create = data => {
  const product = { id: nextId++, ...data };
  products.push(product);
  return product;
};

const replace = (id, data) => {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { id, ...data };
  return products[index];
};

const remove = id => {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  return products.splice(index, 1)[0];
};

const decreaseStock = (id, quantity) => {
  const product = findById(id);
  if (product) product.stock -= quantity;
};

module.exports = { findAll, findById, create, replace, remove, decreaseStock };