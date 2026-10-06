const express = require("express");
const productRepo = require("../repositories/product.repository");

const router = express.Router();

// Comunas de Santiago con entrega express (llega mañana, sin costo).
const EXPRESS_COMUNAS = new Set([
  "las condes", "providencia", "vitacura", "lo barnechea",
  "nunoa", "ñuñoa", "santiago", "san miguel",
]);

// Comunas con entrega estándar 2 días.
const STANDARD_COMUNAS = new Set([
  "la florida", "maipu", "maipú", "pudahuel", "quilicura",
  "recoleta", "independencia", "cerrillos", "la reina",
  "peñalolen", "penalolen", "el bosque", "estacion central",
  "la cisterna", "san joaquin", "san joaquín",
]);

// POST /api/shipping/quote
// Body: { productId: number, comuna: string }
// Response: { etaLabel: string, cost: number }
router.post("/quote", (req, res) => {
  const { productId, comuna } = req.body || {};

  if (!productId || !comuna) {
    return res.status(400).json({ error: "productId y comuna son obligatorios" });
  }

  const product = productRepo.findById(Number(productId));
  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  const comunaNorm = String(comuna).toLowerCase().trim();

  let etaLabel, cost;
  if (EXPRESS_COMUNAS.has(comunaNorm)) {
    etaLabel = "Llega mañana";
    cost = 0;
  } else if (STANDARD_COMUNAS.has(comunaNorm)) {
    etaLabel = "Llega en 2 días hábiles";
    cost = 2990;
  } else {
    etaLabel = "Llega en 3-5 días hábiles";
    cost = 4990;
  }

  res.json({ productId: product.id, comuna, etaLabel, cost });
});

module.exports = router;
