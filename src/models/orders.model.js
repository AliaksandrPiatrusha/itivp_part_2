const STATUSES = ['new', 'paid', 'shipped', 'delivered', 'cancelled'];

const orders = [];

let nextId = 1;

const calcTotal = items =>
  Number(items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));

const findAll = ({ status, customer } = {}) =>
  orders.filter(o =>
    (!status || o.status === status) &&
    (!customer || o.customer.name.toLowerCase().includes(String(customer).toLowerCase()))
  );

const findById = id => orders.find(o => o.id === id) || null;

const create = ({ customer, items }) => {
  const order = {
    id: nextId++,
    customer,
    items,
    total: calcTotal(items),
    status: 'new',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  return order;
};

const replace = (id, { customer, items, status }) => {
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;
  orders[index] = {
    ...orders[index],
    customer,
    items,
    status,
    total: calcTotal(items),
    updatedAt: new Date().toISOString()
  };
  return orders[index];
};

const updateStatus = (id, status) => {
  const order = findById(id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
};

const remove = id => {
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;
  return orders.splice(index, 1)[0];
};

module.exports = { STATUSES, findAll, findById, create, replace, updateStatus, remove };