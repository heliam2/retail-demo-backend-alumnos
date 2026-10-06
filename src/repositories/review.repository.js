const { getState, persist } = require("../db");

function findByProduct(productId) {
  return getState().reviews.filter((r) => r.productId === productId);
}

function findByUserAndProduct(userId, productId) {
  return getState().reviews.find((r) => r.productId === productId && r.userId === userId) || null;
}

function findById(id) {
  return getState().reviews.find((r) => r.id === id) || null;
}

function create(data) {
  const state = getState();
  const review = { id: state.nextIds.review++, ...data };
  state.reviews.push(review);
  persist();
  return review;
}

function update(id, changes) {
  const review = findById(id);
  if (!review) return null;
  Object.assign(review, changes);
  persist();
  return review;
}

function remove(id) {
  const state = getState();
  const idx = state.reviews.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  state.reviews.splice(idx, 1);
  persist();
  return true;
}

module.exports = { findByProduct, findByUserAndProduct, findById, create, update, remove };
