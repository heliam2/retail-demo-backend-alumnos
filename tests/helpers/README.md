# `helpers/` — datos y utilidades compartidas

Capa 2 y capa 4 de la arquitectura: lo que usan las pruebas de varios niveles.

| Archivo | Qué es |
|---|---|
| `datos.js` | Los datos del seed en un solo lugar: usuarios, cupones, productos y reglas de precio |

## Por qué existe

Para que ninguna prueba escriba `'EXPIRADO'` o el id `9` a mano. Si mañana
cambia el seed, se toca un archivo y no veinte.

```js
const { CUPONES, PRODUCTOS } = require("../helpers/datos");
```

## Qué más va acá

Cuando repitas el mismo bloque por tercera vez —iniciar sesión, llenar un carro,
dejar un pedido listo para pagar— extráelo acá como una función con nombre de
negocio. Eso es la **capa 4**, y es lo que hace que una prueba se lea como el
flujo que verifica en vez de como una secuencia de peticiones HTTP.

Los equivalentes en las otras herramientas:

- Karate → `../karate-config.js`
- Playwright → `tests/e2e/demo-clase11/datos/` en el repositorio del frontend
