const express = require("express");
const cartRepo = require("../repositories/cart.repository");
const productRepo = require("../repositories/product.repository");
const orderRepo = require("../repositories/order.repository");
const couponRepo = require("../repositories/coupon.repository");
const uow = require("../repositories/unit-of-work");
const { authRequired } = require("../middleware/auth.middleware");
const { calculateOrderTotals } = require("../utils/pricing");

const router = express.Router();
router.use(authRequired);

// POST /api/orders/quote { couponCode }
// Calcula el total sin confirmar la compra. Util para el paso "aplicar cupon"
// en el checkout, y para pruebas de la logica de pricing sin efectos secundarios.
router.post("/quote", (req, res) => {
  const cart = cartRepo.getItems(req.user.id);
  if (cart.length === 0) return res.status(400).json({ error: "El carro esta vacio" });

  const result = calculateOrderTotals({
    items: cart,
    products: productRepo.findAll(),
    coupons: couponRepo.findAll(),
    couponCode: req.body?.couponCode,
  });

  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

// POST /api/orders/checkout { couponCode }
router.post("/checkout", (req, res) => {
  const cart = cartRepo.getItems(req.user.id);
  if (cart.length === 0) return res.status(400).json({ error: "El carro esta vacio" });

  // Revalidar stock al momento del pago (puede haber cambiado desde que se agrego al carro)
  for (const item of cart) {
    const product = productRepo.findById(item.productId);
    if (!product) return res.status(404).json({ error: `Producto ${item.productId} ya no existe` });
    if (item.quantity > product.stock) {
      return res.status(409).json({ error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` });
    }
  }

  const totals = calculateOrderTotals({
    items: cart,
    products: productRepo.findAll(),
    coupons: couponRepo.findAll(),
    couponCode: req.body?.couponCode,
  });
  if (totals.error) return res.status(400).json({ error: totals.error });

  // Descontar stock, crear la orden y vaciar el carro como una sola unidad
  // de trabajo: persist() de cada repository se colapsa en una escritura.
  const order = uow.runInTransaction(() => {
    const snapshotItems = cart.map((item) => {
      const product = productRepo.decrementStock(item.productId, item.quantity);
      return {
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
      };
    });

    const created = orderRepo.create(req.user.id, {
      items: snapshotItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponApplied: totals.couponApplied,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
      status: "pagado",
    });

    cartRepo.clearCart(req.user.id);
    return created;
  });

  res.status(201).json(order);
});

// GET /api/orders
router.get("/", (req, res) => {
  res.json(orderRepo.findAllByUser(req.user.id));
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = orderRepo.findById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  res.json(order);
});

module.exports = router;
