const { getState, persist } = require("../db");

function findByEmail(email) {
  const target = String(email).toLowerCase();
  return getState().users.find((u) => u.email.toLowerCase() === target) || null;
}

function findById(id) {
  return getState().users.find((u) => u.id === id) || null;
}

function create(data) {
  const state = getState();
  const user = { id: state.nextIds.user++, ...data };
  state.users.push(user);
  persist();
  return user;
}

function update(id, changes) {
  const user = findById(id);
  if (!user) return null;
  Object.entries(changes).forEach(([key, value]) => {
    if (value !== undefined) user[key] = value;
  });
  persist();
  return user;
}

module.exports = { findByEmail, findById, create, update };
