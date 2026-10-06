const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/user.repository");
const { JWT_SECRET, authRequired } = require("../middleware/auth.middleware");
const { isValidRut, formatRut } = require("../utils/rut");

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Teléfono chileno: +56 9 XXXX XXXX (con o sin "+" y espacios).
const PHONE_REGEX = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;
const BIRTHDATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Forma pública del usuario: nunca expone el hash de la contraseña.
function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone ?? null,
    rut: u.rut ?? null,
    birthDate: u.birthDate ?? null,
    role: u.role,
    loyaltyPoints: u.loyaltyPoints ?? 0,
    createdAt: u.createdAt,
  };
}

// Normaliza un teléfono válido a "+56 9 XXXX XXXX".
function normalizePhone(value) {
  const digits = String(value).replace(/\D/g, "").replace(/^56/, "");
  return `+56 9 ${digits.slice(1, 5)} ${digits.slice(5, 9)}`;
}

router.post("/register", (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password y name son obligatorios" });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "email invalido" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "password debe tener al menos 6 caracteres" });
  }

  if (userRepo.findByEmail(email)) {
    return res.status(409).json({ error: "El email ya esta registrado" });
  }

  const user = userRepo.create({
    email,
    password: bcrypt.hashSync(password, 8),
    name,
    role: "customer",
    phone: null,
    rut: null,
    birthDate: null,
    loyaltyPoints: 0,
    createdAt: new Date().toISOString(),
  });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "2h" });
  return res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email y password son obligatorios" });
  }

  const user = userRepo.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Credenciales invalidas" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me - perfil del usuario autenticado
router.get("/me", authRequired, (req, res) => {
  const user = userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(publicUser(user));
});

// PUT /api/auth/me - actualiza nombre, telefono, RUT y fecha de nacimiento.
// El email, el rol y los puntos NO son editables por esta via.
router.put("/me", authRequired, (req, res) => {
  if (!userRepo.findById(req.user.id)) return res.status(404).json({ error: "Usuario no encontrado" });

  const { name, phone, rut, birthDate } = req.body || {};
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name no puede estar vacio" });
    }
    updates.name = name.trim();
  }

  if (phone !== undefined) {
    if (phone === null || phone === "") {
      updates.phone = null;
    } else if (typeof phone === "string" && PHONE_REGEX.test(phone.trim())) {
      updates.phone = normalizePhone(phone.trim());
    } else {
      return res.status(400).json({ error: "telefono invalido, usa el formato +56 9 XXXX XXXX" });
    }
  }

  if (rut !== undefined) {
    if (rut === null || rut === "") {
      updates.rut = null;
    } else if (typeof rut === "string" && isValidRut(rut)) {
      updates.rut = formatRut(rut);
    } else {
      return res.status(400).json({ error: "RUT invalido" });
    }
  }

  if (birthDate !== undefined) {
    if (birthDate === null || birthDate === "") {
      updates.birthDate = null;
    } else if (typeof birthDate === "string" && BIRTHDATE_REGEX.test(birthDate)) {
      const d = new Date(`${birthDate}T00:00:00Z`);
      const now = new Date();
      const minDate = new Date();
      minDate.setUTCFullYear(now.getUTCFullYear() - 120);
      if (Number.isNaN(d.getTime()) || d > now || d < minDate) {
        return res.status(400).json({ error: "fecha de nacimiento invalida" });
      }
      updates.birthDate = birthDate;
    } else {
      return res.status(400).json({ error: "fecha de nacimiento invalida, usa el formato YYYY-MM-DD" });
    }
  }

  const user = userRepo.update(req.user.id, updates);
  return res.json(publicUser(user));
});

// PUT /api/auth/password - cambia la contraseña validando la actual.
router.put("/password", authRequired, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword y newPassword son obligatorios" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "newPassword debe tener al menos 6 caracteres" });
  }

  const user = userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: "La contraseña actual no es correcta" });
  }

  userRepo.update(req.user.id, { password: bcrypt.hashSync(newPassword, 8) });
  return res.json({ ok: true });
});

module.exports = router;
