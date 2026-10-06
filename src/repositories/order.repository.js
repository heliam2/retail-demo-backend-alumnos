const { getState, persist } = require("../db");

function findAllByUser(userId) {
  return getState().orders.filter((o) => o.userId === userId);
}

function findById(id) {
  return getState().orders.find((o) => o.id === id) || null;
}

function create(userId, data) {
  const state = getState();
  const order = {
    id: state.nextIds.order++,
    userId,
    ...data,
    createdAt: new Date().toISOString(),
  };
  state.orders.push(order);
  persist();
  return order;
}

function findAll() {
  return getState().orders;
}

function updateStatus(id, status) {
  const order = findById(id);
  if (!order) return null;
  order.status = status;
  persist();
  return order;
}

module.exports = { findAllByUser, findById, create, findAll, updateStatus };
