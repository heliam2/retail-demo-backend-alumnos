const express = require("express");
const reviewRepo = require("../repositories/review.repository");
const productRepo = require("../repositories/product.repository");
const { authRequired } = require("../middleware/auth.middleware");

const router = express.Router();

function withAverage(productId, reviews) {
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  return { reviews, average, count: reviews.length };
}

// GET /api/reviews/product/:productId
router.get("/product/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  if (!productRepo.findById(productId)) return res.status(404).json({ error: "Producto no encontrado" });

  res.json(withAverage(productId, reviewRepo.findByProduct(productId)));
});

// POST /api/reviews { productId, rating, comment }
// Regla de negocio esperada: solo puede reseñar un producto un usuario que
// lo haya comprado previamente (busca en sus ordenes). Un review por
// usuario y producto (si ya existe, se actualiza).
router.post("/", authRequired, (req, res) => {
  const { productId, rating, comment } = req.body || {};
  if (!productId || rating == null) {
    return res.status(400).json({ error: "productId y rating son obligatorios" });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "rating debe ser un entero entre 1 y 5" });
  }

  const product = productRepo.findById(Number(productId));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  const existing = reviewRepo.findByUserAndProduct(req.user.id, product.id);
  if (existing) {
    const updated = reviewRepo.update(existing.id, { rating: ratingNum, comment: comment || "", updatedAt: new Date().toISOString() });
    return res.json(updated);
  }

  const review = reviewRepo.create({
    productId: product.id,
    userId: req.user.id,
    userName: req.user.email,
    rating: ratingNum,
    comment: comment || "",
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(review);
});

// DELETE /api/reviews/:id (solo el autor puede borrar su propia reseña)
router.delete("/:id", authRequired, (req, res) => {
  const review = reviewRepo.findById(Number(req.params.id));
  if (!review) return res.status(404).json({ error: "Reseña no encontrada" });
  if (review.userId !== req.user.id) {
    return res.status(403).json({ error: "No puedes eliminar la reseña de otro usuario" });
  }
  reviewRepo.remove(review.id);
  res.status(204).send();
});

module.exports = router;
