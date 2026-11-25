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
    // El mensaje al cliente es deliberadamente vago (no se le dice a un
    // atacante si el token expiro o venia mal firmado), pero el motivo real se
    // registra: `e.name` distingue TokenExpiredError de JsonWebTokenError.
    // Sin esta linea, un 401 "Token invalido o expirado" no dice cual de los
    // dos fue, y diagnosticarlo obliga a adivinar.
    console.warn(`[auth] token rechazado: ${e.name}`);
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
