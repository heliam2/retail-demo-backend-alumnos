// -----------------------------------------------------------------------
// Reglas de negocio de precios. Concentradas aqui a proposito: son un buen
// objetivo para pruebas de componente (unitarias) con clases de
// equivalencia y valores limite (boundary values).
// -----------------------------------------------------------------------

const TAX_RATE = 0.19; // IVA 19%
const FREE_SHIPPING_THRESHOLD = 30000; // CLP
const SHIPPING_COST = 3000; // CLP

function calculateSubtotal(items, products) {
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    return sum + product.price * item.quantity;
  }, 0);
}

function findValidCoupon(coupons, code, subtotal) {
  if (!code) return { coupon: null, error: null };
  const coupon = coupons.find((c) => c.code.toUpperCase() === String(code).toUpperCase());
  if (!coupon) return { coupon: null, error: "Cupon no existe" };
  if (!coupon.active) return { coupon: null, error: "Cupon inactivo" };
  if (new Date(coupon.expiresAt).getTime() < Date.now()) return { coupon: null, error: "Cupon expirado" };
  if (subtotal < coupon.minOrderAmount) {
    return { coupon: null, error: `El monto minimo para este cupon es $${coupon.minOrderAmount}` };
  }
  return { coupon, error: null };
}

function calculateOrderTotals({ items, products, coupons, couponCode }) {
  const subtotal = calculateSubtotal(items, products);
  const { coupon, error } = findValidCoupon(coupons, couponCode, subtotal);
  if (couponCode && error) {
    return { error };
  }

  const discount = coupon ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0;
  const taxableAmount = subtotal - discount;
  const tax = Math.round(taxableAmount * TAX_RATE);
  const shipping = taxableAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = taxableAmount + tax + shipping;

  return {
    subtotal,
    discount,
    couponApplied: coupon ? coupon.code : null,
    tax,
    shipping,
    total,
    error: null,
  };
}

module.exports = {
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
  calculateSubtotal,
  findValidCoupon,
  calculateOrderTotals,
};
