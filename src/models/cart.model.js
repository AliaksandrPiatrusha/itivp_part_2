const cart = { items: [] };

let nextItemId = 1;

const getItems = () => cart.items;

const findItem = id => cart.items.find(i => i.id === id) || null;

const findSame = (productId, size) =>
  cart.items.find(i => i.productId === productId && i.size === size) || null;

const addItem = ({ productId, title, size, price, quantity }) => {
  const existing = findSame(productId, size);
  if (existing) {
    existing.quantity += quantity;
    return existing;
  }
  const item = { id: nextItemId++, productId, title, size, price, quantity };
  cart.items.push(item);
  return item;
};

const updateItem = (id, quantity) => {
  const item = findItem(id);
  if (!item) return null;
  item.quantity = quantity;
  return item;
};

const removeItem = id => {
  const index = cart.items.findIndex(i => i.id === id);
  if (index === -1) return null;
  return cart.items.splice(index, 1)[0];
};

const clear = () => {
  cart.items = [];
};

const total = () =>
  Number(cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));

module.exports = { getItems, findItem, addItem, updateItem, removeItem, clear, total };