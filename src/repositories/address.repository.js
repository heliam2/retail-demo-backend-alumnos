const { getState, persist } = require("../db");

function getAll(userId) {
  const state = getState();
  if (!state.addresses[userId]) state.addresses[userId] = [];
  return state.addresses[userId];
}

function findById(userId, id) {
  return getAll(userId).find((a) => a.id === id) || null;
}

function create(userId, data) {
  const state = getState();
  const list = getAll(userId);
  const address = { id: state.nextIds.address++, ...data };
  list.push(address);
  persist();
  return address;
}

function update(userId, id, changes) {
  const address = findById(userId, id);
  if (!address) return null;
  Object.entries(changes).forEach(([key, value]) => {
    if (value !== undefined) address[key] = value;
  });
  persist();
  return address;
}

function remove(userId, id) {
  const list = getAll(userId);
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  persist();
  return true;
}

module.exports = { getAll, findById, create, update, remove };
