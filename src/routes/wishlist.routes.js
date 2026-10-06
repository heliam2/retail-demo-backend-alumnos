const express = require("express");
const wishlistRepo = require("../repositories/wishlist.repository");
const productRepo = require("../repositories/product.repository");
const { authRequired } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authRequired);

// GET /api/wishlist
router.get("/", (req, res) => {
  const productIds = wishlistRepo.getItems(req.user.id);
  const allProducts = productRepo.findAll();
  const items = productIds.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean);
  res.json({ items });
});

// POST /api/wishlist/items { productId }
router.post("/items", (req, res) => {
  const { productId } = req.body || {};
  if (!productId) return res.status(400).json({ error: "productId es obligatorio" });

  const product = productRepo.findById(Number(productId));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  const items = wishlistRepo.addItem(req.user.id, product.id);
  res.status(201).json({ items });
});

// DELETE /api/wishlist/items/:productId
router.delete("/items/:productId", (req, res) => {
  const items = wishlistRepo.removeItem(req.user.id, Number(req.params.productId));
  res.json({ items });
});

module.exports = router;
