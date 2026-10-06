const { getState, persist } = require("../db");

function findAll() {
  return getState().products;
}

function findById(id) {
  return getState().products.find((p) => p.id === id) || null;
}

function findByFilters({ category, search } = {}) {
  let products = getState().products;
  if (category) {
    products = products.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const term = String(search).toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(term));
  }
  return products;
}

function findStoreAvailability(productId) {
  const { stores, storeInventory } = getState();
  return (storeInventory || [])
    .filter((entry) => entry.productId === productId)
    .map((entry) => {
      const store = (stores || []).find((s) => s.id === entry.storeId);
      return { storeId: entry.storeId, storeName: store ? store.name : "Tienda", qty: entry.qty };
    });
}

function create(product) {
  const state = getState();
  const newId = Math.max(0, ...state.products.map((p) => p.id)) + 1;
  const created = { id: newId, ...product };
  state.products.push(created);
  persist();
  return created;
}

function update(id, changes) {
  const product = findById(id);
  if (!product) return null;
  Object.entries(changes).forEach(([key, value]) => {
    if (value !== undefined) product[key] = value;
  });
  persist();
  return product;
}

function remove(id) {
  const state = getState();
  const idx = state.products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  state.products.splice(idx, 1);
  persist();
  return true;
}

function decrementStock(id, quantity) {
  const product = findById(id);
  if (!product) return null;
  product.stock -= quantity;
  persist();
  return product;
}

module.exports = { findAll, findById, findByFilters, findStoreAvailability, create, update, remove, decrementStock };
