// -----------------------------------------------------------------------
// Validación y formateo de RUT chileno.
// Se mantiene sin dependencias: normaliza el string, valida el cuerpo
// numérico y el dígito verificador con el algoritmo módulo 11.
// -----------------------------------------------------------------------

// Deja solo dígitos y la K final (en mayúscula), sin puntos ni guion.
function normalizeRut(value) {
  return String(value || "")
    .replace(/[.\-\s]/g, "")
    .toUpperCase();
}

// Calcula el dígito verificador esperado para un cuerpo numérico (string).
function computeDv(body) {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
}

function isValidRut(value) {
  const clean = normalizeRut(value);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return computeDv(body) === dv;
}

// Devuelve el RUT con puntos y guion: 18420789K -> 18.420.789-K
function formatRut(value) {
  const clean = normalizeRut(value);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}

module.exports = { isValidRut, formatRut, normalizeRut };
