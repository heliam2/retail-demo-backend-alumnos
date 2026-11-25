/*
 * GATE DE CONTRATO · clase 12
 *
 * Compara dos artefactos que tienen que decir lo mismo:
 *
 *   openapi.yaml         <-- el contrato que publicamos
 *   src/routes/*.js      <-- las rutas que realmente existen
 *
 * No levanta el servidor, no hace una sola peticion HTTP y no toca data.json.
 * Solo lee el contrato y le pregunta a Express que rutas tiene montadas.
 * Por eso corre en menos de un segundo y puede vivir en la etapa de commit,
 * junto a las unitarias.
 *
 * QUE ES Y QUE NO ES:
 * Esto es una verificacion estatica de consistencia entre codigo y contrato
 * ("drift"). NO es contract testing dirigido por el consumidor (Pact): ahi lo
 * que se verifica son las expectativas de un consumidor concreto contra las
 * respuestas reales del proveedor. Esta prueba es mas barata y mas limitada:
 * detecta que el contrato quedo desactualizado, no que el consumidor se rompa.
 *
 * POR QUE IMPORTA IGUAL:
 * El dia que alguien agregue POST /api/orders/cancel y se olvide del
 * openapi.yaml, esta prueba se pone roja en el commit. Sin ella, el que se
 * entera es el equipo de frontend, tres dias despues, leyendo un contrato que
 * miente.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const app = require("../../src/app");

const RAIZ = path.join(__dirname, "..", "..");
const METODOS = ["get", "post", "put", "delete", "patch"];

/* --- Lado A: lo que declara el contrato ------------------------------------ */

function rutasDelContrato() {
  const doc = yaml.load(fs.readFileSync(path.join(RAIZ, "openapi.yaml"), "utf8"));

  // El contrato declara los paths sin el prefijo porque vive en `servers`.
  // Lo recuperamos de ahi en lugar de escribir '/api' a mano: si manana el
  // prefijo cambia, esta prueba sigue siendo correcta.
  const prefijo = new URL(doc.servers[0].url).pathname.replace(/\/$/, "");

  const rutas = [];
  for (const [ruta, operaciones] of Object.entries(doc.paths)) {
    for (const metodo of Object.keys(operaciones)) {
      if (METODOS.includes(metodo)) {
        rutas.push(`${metodo.toUpperCase()} ${prefijo}${ruta}`);
      }
    }
  }
  return rutas;
}

/* --- Lado B: lo que tiene montado Express --------------------------------- */

function rutasDeExpress() {
  const rutas = [];

  function recorrer(capas, prefijo) {
    for (const capa of capas) {
      if (capa.route) {
        for (const metodo of Object.keys(capa.route.methods)) {
          rutas.push(`${metodo.toUpperCase()} ${prefijo}${capa.route.path}`);
        }
      } else if (capa.name === "router" && capa.handle?.stack) {
        recorrer(capa.handle.stack, prefijo + segmentoDe(capa));
      }
    }
  }

  // Express guarda el prefijo de cada router como expresion regular
  // (`/^\/api\/orders\/?(?=\/|$)/i`). Esto la vuelve a convertir en texto.
  function segmentoDe(capa) {
    return (capa.regexp?.source || "")
      .replace("^\\/", "/")
      .replace("\\/?(?=\\/|$)", "")
      .replace(/\\\//g, "/")
      .replace(/\$$/, "");
  }

  recorrer(app._router?.stack || app.router.stack, "");
  return rutas;
}

/* --- Normalizacion --------------------------------------------------------- */

/*
 * Las dos fuentes nombran los parametros distinto y una agrega barras finales:
 *   contrato  GET /api/products/{id}
 *   Express   GET /api/products/:id
 *   Express   GET /api/addresses/      <-- barra final por el router
 * Nada de eso es una diferencia real, asi que se iguala antes de comparar.
 * Solo se comparan metodo y forma de la ruta, no parametros ni esquemas.
 */
function normalizar(ruta) {
  return ruta
    .replace(/\{(\w+)\}/g, ":$1")   // {id} -> :id
    .replace(/\/+$/, "")            // quita la barra final
    .replace(/:\w+/g, ":param");    // :id y :productId son el mismo hueco
}

function comparar() {
  const contrato = new Set(rutasDelContrato().map(normalizar));
  const codigo = new Set(rutasDeExpress().map(normalizar));

  return {
    contrato,
    codigo,
    // Rutas que existen en el codigo y nadie declaro: el contrato esta incompleto.
    sinDeclarar: [...codigo].filter((r) => !contrato.has(r)).sort(),
    // Rutas prometidas en el contrato que no existen: el contrato miente.
    sinImplementar: [...contrato].filter((r) => !codigo.has(r)).sort(),
  };
}

/* --- Las pruebas ----------------------------------------------------------- */

describe("gate de contrato · openapi.yaml contra las rutas reales", () => {
  const r = comparar();

  test("toda ruta implementada esta declarada en el contrato", () => {
    expect(r.sinDeclarar).toEqual([]);
  });

  test("toda ruta del contrato esta implementada", () => {
    expect(r.sinImplementar).toEqual([]);
  });

  test("el contrato no esta vacio ni a medias", () => {
    // Una guarda contra el falso verde: si el yaml se rompe y `paths` queda
    // vacio, las dos pruebas de arriba pasarian comparando dos listas vacias.
    expect(r.contrato.size).toBeGreaterThan(20);
    expect(r.codigo.size).toBeGreaterThan(20);
  });
});
