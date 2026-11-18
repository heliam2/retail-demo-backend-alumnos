# Nivel: pruebas de componente ✍️

**Qué deja real:** una ruta HTTP, con su validación y su serialización.
**Qué reemplaza por dobles:** sus dependencias.

Este nivel **lo escribes tú**. El proyecto no trae ninguna.

## Dos formas de hacerlo, las dos válidas

**Con Jest + Supertest** — doblas los repositories y pruebas la ruta por HTTP:

```js
jest.mock("../../src/repositories/product.repository");
const request = require("supertest");
const app = require("../../src/app");

test("GET /api/products/:id devuelve 404 si no existe", async () => {
  // ...
});
```

Convención sugerida: `tests/componentes/<recurso>.routes.test.js`

**Con Karate** — levantas un doble del servicio entero y pruebas contra él.
El ejemplo está en `demo-clase11/contra-doble.feature`, y su doble en
`demo-clase11/api-mock.feature`.

## Lo que define el nivel

No es la herramienta: es que **algo esté doblado**. Si tu prueba toca `db.js` y
`data.json` de verdad, no es de componente — es de integración, y va en la
carpeta de al lado.

```bash
npm test -- tests/componentes
npm run karate -- --tags @componente     # no necesita el backend corriendo
```
