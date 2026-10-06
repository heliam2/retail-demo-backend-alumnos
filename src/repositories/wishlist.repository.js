const { getState, persist } = require("../db");

function getItems(userId) {
  const state = getState();
  if (!state.wishlists[userId]) state.wishlists[userId] = [];
  return state.wishlists[userId];
}

function addItem(userId, productId) {
  const items = getItems(userId);
  if (!items.includes(productId)) {
    items.push(productId);
    persist();
  }
  return items;
}

function removeItem(userId, productId) {
  const items = getItems(userId).filter((id) => id !== productId);
  getState().wishlists[userId] = items;
  persist();
  return items;
}

module.exports = { getItems, addItem, removeItem };
