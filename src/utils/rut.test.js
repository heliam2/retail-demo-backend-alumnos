const { isValidRut, formatRut, normalizeRut } = require("./rut");

describe("normalizeRut", () => {
  it("quita puntos, guion y espacios", () => {
    expect(normalizeRut("18.420.789-3")).toBe("184207893");
  });

  it("convierte la k a mayuscula", () => {
    expect(normalizeRut("5000001-k")).toBe("5000001K");
  });

  it("devuelve string vacio para null/undefined", () => {
    expect(normalizeRut(null)).toBe("");
    expect(normalizeRut(undefined)).toBe("");
  });

  it("no altera un valor ya limpio", () => {
    expect(normalizeRut("184207893")).toBe("184207893");
  });
});

describe("isValidRut", () => {
  it("acepta un rut valido con puntos y guion", () => {
    expect(isValidRut("18.420.789-3")).toBe(true);
  });

  it("acepta un rut valido sin formato", () => {
    expect(isValidRut("184207893")).toBe(true);
  });

  it("acepta otro rut valido conocido", () => {
    expect(isValidRut("76086428-5")).toBe(true);
  });

  it("acepta un rut valido cuyo digito verificador es K", () => {
    expect(isValidRut("5000001-K")).toBe(true);
    expect(isValidRut("5000001-k")).toBe(true);
  });

  it("acepta un rut valido cuyo digito verificador es 0 (resto=11, boundary)", () => {
    expect(isValidRut("1000013-0")).toBe(true);
  });

  it("rechaza un digito verificador incorrecto", () => {
    expect(isValidRut("18.420.789-0")).toBe(false);
  });

  it("rechaza formato invalido (muy corto)", () => {
    expect(isValidRut("123-4")).toBe(false);
  });

  it("rechaza formato invalido (muy largo)", () => {
    expect(isValidRut("123456789-0")).toBe(false);
  });

  it("rechaza caracteres no numericos en el cuerpo", () => {
    expect(isValidRut("184A0789-3")).toBe(false);
  });

  it("rechaza string vacio", () => {
    expect(isValidRut("")).toBe(false);
  });
});

describe("formatRut", () => {
  it("formatea un rut limpio con puntos y guion", () => {
    expect(formatRut("184207893")).toBe("18.420.789-3");
  });

  it("formatea correctamente cuando el digito verificador es K", () => {
    expect(formatRut("5000001K")).toBe("5.000.001-K");
  });

  it("formatea un rut ya con formato sin cambiar el resultado", () => {
    expect(formatRut("76086428-5")).toBe("76.086.428-5");
  });

  it("devuelve el valor tal cual si tiene menos de 2 caracteres", () => {
    expect(formatRut("1")).toBe("1");
    expect(formatRut("")).toBe("");
  });
});
