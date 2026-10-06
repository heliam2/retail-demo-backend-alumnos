const {
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
  calculateSubtotal,
  findValidCoupon,
  calculateOrderTotals,
} = require("./pricing");

const products = [
  { id: 1, price: 10000 },
  { id: 2, price: 5000 },
  { id: 3, price: 30000 },
];

function futureDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function pastDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

describe("calculateSubtotal", () => {
  it("devuelve 0 para un carro vacio", () => {
    expect(calculateSubtotal([], products)).toBe(0);
  });

  it("suma precio * cantidad de un solo item", () => {
    expect(calculateSubtotal([{ productId: 1, quantity: 2 }], products)).toBe(20000);
  });

  it("suma varios items distintos", () => {
    const items = [
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 3 },
    ];
    expect(calculateSubtotal(items, products)).toBe(10000 + 5000 * 3);
  });

  it("ignora items cuyo producto no existe", () => {
    const items = [
      { productId: 1, quantity: 1 },
      { productId: 999, quantity: 5 },
    ];
    expect(calculateSubtotal(items, products)).toBe(10000);
  });
});

describe("findValidCoupon", () => {
  const coupons = [
    { code: "DESC10", active: true, expiresAt: futureDate(), minOrderAmount: 5000, discountPercent: 10 },
    { code: "VENCIDO", active: true, expiresAt: pastDate(), minOrderAmount: 0, discountPercent: 20 },
    { code: "INACTIVO", active: false, expiresAt: futureDate(), minOrderAmount: 0, discountPercent: 20 },
  ];

  it("sin codigo devuelve coupon null y sin error", () => {
    expect(findValidCoupon(coupons, undefined, 100000)).toEqual({ coupon: null, error: null });
  });

  it("codigo inexistente devuelve error 'Cupon no existe'", () => {
    const res = findValidCoupon(coupons, "NOEXISTE", 100000);
    expect(res.coupon).toBeNull();
    expect(res.error).toBe("Cupon no existe");
  });

  it("cupon inactivo devuelve error 'Cupon inactivo'", () => {
    const res = findValidCoupon(coupons, "INACTIVO", 100000);
    expect(res.coupon).toBeNull();
    expect(res.error).toBe("Cupon inactivo");
  });

  it("cupon expirado devuelve error 'Cupon expirado'", () => {
    const res = findValidCoupon(coupons, "VENCIDO", 100000);
    expect(res.coupon).toBeNull();
    expect(res.error).toBe("Cupon expirado");
  });

  it("subtotal bajo el minimo devuelve error con el monto minimo", () => {
    const res = findValidCoupon(coupons, "DESC10", 4999);
    expect(res.coupon).toBeNull();
    expect(res.error).toBe("El monto minimo para este cupon es $5000");
  });

  it("acepta exactamente el monto minimo (boundary)", () => {
    const res = findValidCoupon(coupons, "DESC10", 5000);
    expect(res.error).toBeNull();
    expect(res.coupon.code).toBe("DESC10");
  });

  it("es insensible a mayusculas/minusculas en el codigo", () => {
    const res = findValidCoupon(coupons, "desc10", 5000);
    expect(res.error).toBeNull();
    expect(res.coupon.code).toBe("DESC10");
  });
});

describe("calculateOrderTotals", () => {
  const coupons = [
    { code: "DESC10", active: true, expiresAt: futureDate(), minOrderAmount: 0, discountPercent: 10 },
  ];

  it("calcula subtotal, iva y envio pagado sin cupon (bajo el umbral)", () => {
    const items = [{ productId: 2, quantity: 1 }]; // 5000
    const res = calculateOrderTotals({ items, products, coupons, couponCode: undefined });
    expect(res.error).toBeNull();
    expect(res.subtotal).toBe(5000);
    expect(res.discount).toBe(0);
    expect(res.couponApplied).toBeNull();
    expect(res.tax).toBe(Math.round(5000 * TAX_RATE));
    expect(res.shipping).toBe(SHIPPING_COST);
    expect(res.total).toBe(5000 + res.tax + SHIPPING_COST);
  });

  it("aplica envio gratis justo en el umbral (boundary)", () => {
    const items = [{ productId: 3, quantity: 1 }]; // 30000 == FREE_SHIPPING_THRESHOLD
    const res = calculateOrderTotals({ items, products, coupons, couponCode: undefined });
    expect(res.subtotal).toBe(FREE_SHIPPING_THRESHOLD);
    expect(res.shipping).toBe(0);
  });

  it("cobra envio a un peso menos del umbral (boundary)", () => {
    const items = [{ productId: 3, quantity: 1 }, { productId: 1, quantity: 1 }];
    // 30000 + 10000 = 40000, con 10% descuento => taxable 36000 (arriba del umbral igual)
    // Probamos el caso justo por debajo usando un producto ad-hoc de 29999
    const customProducts = [...products, { id: 99, price: 29999 }];
    const res = calculateOrderTotals({
      items: [{ productId: 99, quantity: 1 }],
      products: customProducts,
      coupons,
      couponCode: undefined,
    });
    expect(res.subtotal).toBe(29999);
    expect(res.shipping).toBe(SHIPPING_COST);
  });

  it("aplica descuento del cupon sobre el subtotal, redondeando", () => {
    const items = [{ productId: 2, quantity: 1 }]; // 5000
    const res = calculateOrderTotals({ items, products, coupons, couponCode: "DESC10" });
    expect(res.discount).toBe(500); // 10% de 5000
    expect(res.couponApplied).toBe("DESC10");
    const taxableAmount = 5000 - 500;
    expect(res.tax).toBe(Math.round(taxableAmount * TAX_RATE));
    expect(res.total).toBe(taxableAmount + res.tax + SHIPPING_COST);
  });

  it("devuelve solo {error} si el cupon indicado no es valido", () => {
    const items = [{ productId: 2, quantity: 1 }];
    const res = calculateOrderTotals({ items, products, coupons, couponCode: "NOEXISTE" });
    expect(res).toEqual({ error: "Cupon no existe" });
  });

  it("un couponCode vacio no genera error aunque no haya cupon valido", () => {
    const items = [{ productId: 2, quantity: 1 }];
    const res = calculateOrderTotals({ items, products, coupons, couponCode: "" });
    expect(res.error).toBeNull();
    expect(res.couponApplied).toBeNull();
  });
});
