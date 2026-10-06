const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-diplomado-qa";

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token invalido o expirado" });
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Requiere rol admin" });
  }
  next();
}

module.exports = { authRequired, adminRequired, JWT_SECRET };
