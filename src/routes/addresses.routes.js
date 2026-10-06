const express = require("express");
const addressRepo = require("../repositories/address.repository");
const { authRequired } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authRequired);

// GET /api/addresses
router.get("/", (req, res) => {
  res.json(addressRepo.getAll(req.user.id));
});

// POST /api/addresses { label, street, city, region, isDefault }
router.post("/", (req, res) => {
  const { label, street, city, region, isDefault } = req.body || {};
  if (!label || !street || !city || !region) {
    return res.status(400).json({ error: "label, street, city y region son obligatorios" });
  }

  const address = addressRepo.create(req.user.id, { label, street, city, region, isDefault: Boolean(isDefault) });
  res.status(201).json(address);
});

// PUT /api/addresses/:id
router.put("/:id", (req, res) => {
  const { label, street, city, region, isDefault } = req.body || {};
  const address = addressRepo.update(req.user.id, Number(req.params.id), { label, street, city, region, isDefault });
  if (!address) return res.status(404).json({ error: "Direccion no encontrada" });
  res.json(address);
});

// DELETE /api/addresses/:id
router.delete("/:id", (req, res) => {
  const removed = addressRepo.remove(req.user.id, Number(req.params.id));
  if (!removed) return res.status(404).json({ error: "Direccion no encontrada" });
  res.status(204).send();
});

module.exports = router;
