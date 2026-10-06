const { getState, persist } = require("../db");

function getItems(userId) {
  const state = getState();
  if (!state.carts[userId]) state.carts[userId] = [];
  return state.carts[userId];
}

function findItem(userId, productId) {
  return getItems(userId).find((i) => i.productId === productId) || null;
}

function addOrIncrementItem(userId, productId, quantity) {
  const items = getItems(userId);
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  persist();
  return items;
}

function setItemQuantity(userId, productId, quantity) {
  const items = getItems(userId);
  const existing = items.find((i) => i.productId === productId);
  if (!existing) return null;
  existing.quantity = quantity;
  persist();
  return items;
}

function removeItem(userId, productId) {
  const items = getItems(userId);
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx === -1) return null;
  items.splice(idx, 1);
  persist();
  return items;
}

function clearCart(userId) {
  getState().carts[userId] = [];
  persist();
}

module.exports = { getItems, findItem, addOrIncrementItem, setItemQuantity, removeItem, clearCart };
