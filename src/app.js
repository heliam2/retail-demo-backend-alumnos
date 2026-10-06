const express = require("express");
const cors = require("cors");
const { reset } = require("./db");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const cartRoutes = require("./routes/cart.routes");
const ordersRoutes = require("./routes/orders.routes");
const reviewsRoutes = require("./routes/reviews.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const addressesRoutes = require("./routes/addresses.routes");
const adminOrdersRoutes = require("./routes/admin.orders.routes");
const shippingRoutes = require("./routes/shipping.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Endpoint SOLO para entornos de prueba: reinicia la "BD" al estado inicial
// (seed) para que cada test/suite parta de datos conocidos y reproducibles.
// Un excelente ejemplo de "test hook" para revisar con los estudiantes.
app.post("/api/test/reset", (req, res) => {
  const state = reset();
  res.json({ status: "reset", counts: { users: state.users.length, products: state.products.length } });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/shipping", shippingRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejador de errores centralizado
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
