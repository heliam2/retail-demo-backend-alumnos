const express = require("express");
const productRepo = require("../repositories/product.repository");
const { authRequired, adminRequired } = require("../middleware/auth.middleware");

const router = express.Router();

// GET /api/products?category=&search=
router.get("/", (req, res) => {
  const { category, search } = req.query;
  res.json(productRepo.findByFilters({ category, search }));
});

router.get("/:id", (req, res) => {
  const product = productRepo.findById(Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

// GET /api/products/:id/availability
// Devuelve el stock disponible en cada tienda física.
router.get("/:id/availability", (req, res) => {
  const productId = Number(req.params.id);
  if (!productRepo.findById(productId)) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  res.json(productRepo.findStoreAvailability(productId));
});

// Rutas de administracion (requieren rol admin) - utiles para practicar
// pruebas de autorizacion (403 vs 401).
router.post("/", authRequired, adminRequired, (req, res) => {
  const { sku, name, description, price, stock, category, imageUrl } = req.body || {};
  if (!sku || !name || price == null || stock == null || !category) {
    return res.status(400).json({ error: "sku, name, price, stock y category son obligatorios" });
  }
  if (price < 0 || stock < 0) {
    return res.status(400).json({ error: "price y stock no pueden ser negativos" });
  }

  const product = productRepo.create({ sku, name, description: description || "", price, stock, category, imageUrl: imageUrl || "" });
  res.status(201).json(product);
});

router.put("/:id", authRequired, adminRequired, (req, res) => {
  const { name, description, price, stock, category, imageUrl } = req.body || {};
  if (price != null && price < 0) return res.status(400).json({ error: "price no puede ser negativo" });
  if (stock != null && stock < 0) return res.status(400).json({ error: "stock no puede ser negativo" });

  const product = productRepo.update(Number(req.params.id), { name, description, price, stock, category, imageUrl });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

router.delete("/:id", authRequired, adminRequired, (req, res) => {
  const removed = productRepo.remove(Number(req.params.id));
  if (!removed) return res.status(404).json({ error: "Producto no encontrado" });
  res.status(204).send();
});

module.exports = router;
