const express = require("express");
const orderRepo = require("../repositories/order.repository");
const { authRequired, adminRequired } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authRequired, adminRequired);

// GET /api/admin/orders - todas las ordenes de todos los usuarios
router.get("/", (req, res) => {
  res.json(orderRepo.findAll());
});

// GET /api/admin/orders/:id
router.get("/:id", (req, res) => {
  const order = orderRepo.findById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  res.json(order);
});

// PUT /api/admin/orders/:id/status { status }
// Estados esperados del flujo: pagado -> enviado -> entregado (o cancelado
// desde pagado/enviado).
router.put("/:id/status", (req, res) => {
  const { status } = req.body || {};
  const order = orderRepo.updateStatus(Number(req.params.id), status);
  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  res.json(order);
});

module.exports = router;
