/*
 * CAPA 2 · datos de prueba compartidos.
 *
 * Una sola fuente de verdad para los datos del seed. Ninguna prueba deberia
 * escribir 'EXPIRADO' ni el id 9 a mano: los pide aqui. Si manana cambia el
 * seed del backend, se toca este archivo y ninguno mas.
 *
 * Lo usan las pruebas de componente e integracion escritas con Jest.
 * El equivalente para Karate es ../karate-config.js, y el del frontend es
 * tests/e2e/demo-clase11/datos/fixtures.js del repositorio del frontend.
 */

const USUARIOS = {
  cliente: { email: "cliente@demo.cl", password: "Demo1234" },
  admin:   { email: "admin@demo.cl",   password: "Admin1234" },
};

/*
 * Los cuatro cupones del seed son las cuatro clases de equivalencia de la
 * validacion: valido sin restriccion, valido con restriccion, expirado e
 * inactivo. El quinto es para el caso "no existe".
 */
const CUPONES = {
  valido:      "BIENVENIDO10",  // 10%, sin monto minimo
  conMinimo:   "VERANO20",      // 20%, exige subtotal >= 30000
  expirado:    "EXPIRADO",      // vencio en 2020
  inactivo:    "INACTIVO",      // existe pero esta desactivado
  inexistente: "NO_EXISTE_123",
};

const PRODUCTOS = {
  // $18.990: queda bajo el minimo de VERANO20 y bajo el umbral de envio gratis.
  barato: { id: 9, sku: "SKU-009", nombre: "Sandalias Sport Flex", precio: 18990 },
  // $45.990: supera los dos umbrales.
  caro:   { id: 1, sku: "SKU-001", nombre: "Zapatillas Urban Runner", precio: 45990 },
};

const REGLAS = {
  iva: 0.19,
  envio: 3000,
  umbralEnvioGratis: 30000,
};

module.exports = { USUARIOS, CUPONES, PRODUCTOS, REGLAS };
