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

// El health informa QUE VERSION esta corriendo, no solo que algo responde.  Se agrega comentario para la demo de la clase de pipelines
// Sin este dato, un smoke test despues de un despliegue no puede distinguir
// "la version nueva ya esta arriba" de "la version vieja sigue contestando",
// que es el falso verde mas caro de un pipeline de entrega. Demo para activar pipeline
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    version: process.env.APP_VERSION || "dev",
    // RENDER_GIT_COMMIT lo fija Render solo en cada despliegue.
    commit: (process.env.GIT_SHA || process.env.RENDER_GIT_COMMIT || "local").slice(0, 7),
  })
);

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
