const { getState } = require("../db");

function findAll() {
  return getState().coupons;
}

module.exports = { findAll };
