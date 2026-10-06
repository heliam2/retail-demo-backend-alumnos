const express = require("express");
const cartRepo = require("../repositories/cart.repository");
const productRepo = require("../repositories/product.repository");
const { authRequired } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authRequired);

function enrichCart(cart, products) {
  return cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      product: product || null,
      lineTotal: product ? product.price * item.quantity : 0,
    };
  });
}

// GET /api/cart
router.get("/", (req, res) => {
  const cart = cartRepo.getItems(req.user.id);
  res.json({ items: enrichCart(cart, productRepo.findAll()) });
});

// POST /api/cart/items { productId, quantity }
router.post("/items", (req, res) => {
  const { productId, quantity } = req.body || {};
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "productId y quantity (>0) son obligatorios" });
  }

  const product = productRepo.findById(Number(productId));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  const existing = cartRepo.findItem(req.user.id, product.id);
  const desiredQty = (existing ? existing.quantity : 0) + Number(quantity);

  if (desiredQty > product.stock) {
    return res.status(409).json({ error: `Stock insuficiente. Disponible: ${product.stock}` });
  }

  const cart = cartRepo.addOrIncrementItem(req.user.id, product.id, Number(quantity));
  res.status(201).json({ items: enrichCart(cart, productRepo.findAll()) });
});

// PUT /api/cart/items/:productId { quantity }
router.put("/items/:productId", (req, res) => {
  const { quantity } = req.body || {};
  if (quantity == null || quantity <= 0) {
    return res.status(400).json({ error: "quantity debe ser mayor que 0 (use DELETE para eliminar)" });
  }

  const product = productRepo.findById(Number(req.params.productId));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  const cart = cartRepo.setItemQuantity(req.user.id, product.id, Number(quantity));
  if (!cart) return res.status(404).json({ error: "El producto no esta en el carro" });

  res.json({ items: enrichCart(cart, productRepo.findAll()) });
});

// DELETE /api/cart/items/:productId
router.delete("/items/:productId", (req, res) => {
  const cart = cartRepo.removeItem(req.user.id, Number(req.params.productId));
  if (!cart) return res.status(404).json({ error: "El producto no esta en el carro" });
  res.json({ items: enrichCart(cart, productRepo.findAll()) });
});

module.exports = router;
