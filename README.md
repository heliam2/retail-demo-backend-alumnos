# QA Retail — Backend

La **API REST completa** que le da vida a la tienda simulada "ChileRetail": maneja
catálogo, autenticación, carro, checkout, órdenes, reseñas, wishlist, direcciones y
envíos con lógica de negocio real (no son mocks ni respuestas fijas). Es la mitad
backend del proyecto — el frontend vive en el repo hermano
[`retail-demo-frontend`](../retail-demo-frontend);

Pensado como campo de práctica de QA: además de servir la API, viene con las
**pruebas unitarias ya escritas** (13 suites, 108 tests Jest) como referencia. Las
**pruebas de componente y de integración las escribes tú**. Incluye un hook
(`POST /api/test/reset`) para resetear el estado y practicar sin miedo a romper nada.

## Qué se puede hacer

- **Levantar una API de e-commerce real** en minutos, sin base de datos externa
  (persiste en un `data.json` local) — ideal para practicar sin infraestructura.
- **Ejercitar los 8 recursos del dominio**: productos, carro, checkout/órdenes,
  autenticación, reseñas, wishlist, direcciones y cotización de envío — cada uno con
  reglas de negocio reales (stock, cupones, IVA, roles, validación de RUT chileno,
  etc.), no solo CRUDs planos.
- **Correr y estudiar las pruebas unitarias** ya implementadas como ejemplo de cómo se
  ven en la práctica.
- **Escribir tus propios tests de componente e integración** (Jest + Supertest o Karate) contra endpoints reales, con datos
  de seed variados (distintos niveles de stock, cupones con distintos estados, etc.)
  para explorar casos negativos.
- **Practicar autorización** (401 vs 403) con dos roles reales: cliente y admin.
- **Usarlo como backend del frontend** (`retail-demo-frontend`) para probar el flujo
  end-to-end de una compra completa.

| | |
|---|---|
| Stack | Node.js + Express 4 (CommonJS) |
| Puerto | `4000` (`/api/...`) |
| Arquitectura | Rutas → **Repository pattern** → `db.js` (Singleton + Unit of Work) |
| Persistencia | Archivo `data.json` (no hay BD real) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Tests | Jest (unitarias incluidas; componente e integración las escribes tú) |

---

## Cómo levantarlo

```bash
npm install
cp .env.example .env
npm run dev              # equivalente a "npm start": node src/server.js -> http://localhost:4000
```

## Cómo correr los tests

```bash
npm test                                        # Jest: pruebas unitarias — 13 suites, 108 tests
npx jest --coverage --coverageReporters=text    # con cobertura

npx jest src/repositories/cart.repository.test.js   # un archivo puntual
```

### Credenciales de demo

| Rol | Email | Password |
|---|---|---|
| Cliente | `cliente@demo.cl` | `Demo1234` |
| Admin | `admin@demo.cl` | `Admin1234` |

---

## Arranque y capas

- `src/server.js` → carga `.env` (`dotenv`) y levanta el `app`.
- `src/app.js` → crea el Express, aplica `cors()` y `express.json()`, registra rutas y
  dos manejadores finales: **404** (`Ruta no encontrada`) y **error 500 centralizado**.
- `src/db.js` → la "base de datos": Singleton en memoria + Unit of Work (ver abajo).
- `src/repositories/*.repository.js` → **capa Repository**: cada ruta accede a los datos
  únicamente a través de estas funciones, nunca llamando `getState()`/`persist()` de
  `db.js` directamente. Un repository por entidad (`cart`, `product`, `order`, `user`,
  `review`, `wishlist`, `address`, `coupon`), más `unit-of-work.js` (ver abajo).
- `src/routes/*.routes.js` → un router por recurso; contienen solo validación de input,
  autorización y forma de la respuesta (transaction script delgado) — la lógica de
  acceso a datos vive en el repository correspondiente.
- `src/middleware/auth.middleware.js` → `authRequired` y `adminRequired`.
- `src/utils/` → lógica de negocio pura (`pricing.js`, `rut.js`).

## La "base de datos" (`db.js`) — Singleton + Unit of Work

- Todo el estado vive **en memoria** en un objeto `state` (un Singleton: `require("./db")`
  siempre devuelve la misma instancia gracias al cache de módulos de Node) y se
  **persiste a disco** (`data.json`) en cada escritura con `persist()`.
- **Unit of Work:** `runInTransaction(fn)` colapsa varias llamadas a `persist()` dentro
  de `fn` en **una sola escritura a disco**, al salir de la transacción más externa (y
  ninguna si `fn` lanza una excepción). Los repositories no cambian nada para usarlo —
  siguen llamando `persist()` como siempre; es `persist()` la que decide si escribe de
  inmediato o difiere. Lo usa `orders.routes.js` en el checkout (descuenta stock +
  crea la orden + vacía el carro como una sola unidad de trabajo).
- `seedData()` genera el estado inicial: 2 usuarios (`cliente@demo.cl / Demo1234`,
  `admin@demo.cl / Admin1234`), 24 productos en 6 categorías, 3 tiendas físicas con
  inventario por tienda, 4 cupones de descuento, y colecciones vacías para carros,
  órdenes, reseñas, favoritos y direcciones.
- Las **imágenes son SVG generados localmente** (data URI con íconos estilo Lucide)
  para que funcione sin internet.
- `nextIds` simula los autoincrementales.
- **Test hook clave:** `POST /api/test/reset` vuelve a llamar `seedData()` → cada suite
  de tests parte de datos conocidos y reproducibles.
- **Cuidado:** `data.json` es un archivo real compartido entre cualquier proceso que
  corra el backend. Si corres `npm test` (Jest real, sin mocks de `fs`) y después
  levantas el servidor con `npm run dev`, vas a heredar el estado que dejó el último
  test — pégale a `POST /api/test/reset` para volver al seed conocido.

## Autenticación y autorización

- `POST /auth/register` y `/auth/login` devuelven `{ token, user }`. El token es un JWT
  firmado con `JWT_SECRET`, expira en **2h**, y su payload lleva `{ id, email, role }`.
- Las contraseñas se guardan **hasheadas con bcrypt**; `publicUser()` nunca expone el hash.
- `authRequired`: lee `Authorization: Bearer <token>`, verifica el JWT y pone `req.user`.
  Sin token → **401**; token inválido/expirado → **401**.
- `adminRequired`: si `req.user.role !== "admin"` → **403**.
- Esto permite practicar la distinción **401 (no autenticado) vs 403 (autenticado sin
  permiso)**.

## Rutas principales (contratos de la API)

El contrato formal (OpenAPI 3.0) de todos los endpoints —parámetros, cuerpos de
petición, respuestas y códigos de estado, incluidos los casos negativos a
propósito— vive en [`openapi.yaml`](./openapi.yaml). Se escribió **contract
first** respecto del resto de la documentación: describe el comportamiento que
cada ruta debe cumplir, no solo el que tiene hoy. Para explorarlo de forma
interactiva, pega su contenido en [editor.swagger.io](https://editor.swagger.io)
o ábrelo con cualquier visor de OpenAPI.

| Recurso | Endpoints | Notas de negocio |
|---|---|---|
| **auth** | `POST /register`, `POST /login`, `GET/PUT /me`, `PUT /password` | Valida email, largo de password (≥6), teléfono chileno, RUT (módulo 11), fecha de nacimiento. Email/rol/puntos no editables. |
| **products** | `GET /` (filtros `?category=&search=`), `GET /:id`, `GET /:id/availability` | `availability` cruza `storeInventory` con `stores`. `POST/PUT/DELETE` requieren **admin**. |
| **cart** | `GET /`, `POST /items`, `PUT /items/:productId`, `DELETE /items/:productId` | Todo el router usa `authRequired`. Valida `quantity > 0`, acumula si ya existe, y rechaza con **409** si supera el `stock`. Respuesta "enriquecida" con producto y `lineTotal`. |
| **orders** | `POST /quote`, `POST /checkout`, `GET /`, `GET /:id` | `quote` calcula totales **sin efectos secundarios**. `checkout` **revalida stock**, descuenta stock, crea la orden con snapshot de ítems y precios, vacía el carro, estado `"pagado"` — todo envuelto en una transacción (Unit of Work). |
| **reviews** | `GET /product/:id`, `POST /`, `DELETE /:id` | Rating entero 1–5; un review por usuario/producto (si existe, se actualiza); solo el autor puede borrar (**403** si no). |
| **wishlist** | `GET /`, `POST /items`, `DELETE /items/:productId` | Idempotente (no duplica). |
| **addresses** | CRUD completo bajo `authRequired` | Campos obligatorios `label, street, city, region`. |
| **admin/orders** | `GET /`, `GET /:id`, `PUT /:id/status` | Router entero bajo `authRequired + adminRequired`. Flujo esperado: `pagado → enviado → entregado` (o `cancelado`). |
| **shipping** | `POST /quote` `{ productId, comuna }` | Comunas express (llega mañana, $0), estándar ($2.990, 2 días) o resto ($4.990, 3–5 días). |

## Lógica de precios (`utils/pricing.js`) — el corazón para pruebas unitarias

`calculateOrderTotals()` aplica, **en este orden**:
1. `subtotal` = Σ (precio × cantidad).
2. Valida cupón: existencia, `active`, no expirado, `subtotal ≥ minOrderAmount`. Si falla → `{ error }`.
3. `discount` = redondeo(subtotal × %).
4. `tax` = **19% IVA sobre (subtotal − descuento)**.
5. `shipping` = **$0 si (subtotal − descuento) ≥ $30.000**, si no **$3.000**.
6. `total` = base + IVA + envío.

Está aislada a propósito: es ideal para **clases de equivalencia y valores límite**.

## Utilidad de RUT (`utils/rut.js`)

Normaliza, valida cuerpo + dígito verificador con **algoritmo módulo 11**, y formatea
`18420789K → 18.420.789-K`.

---

## Tests — qué viene hecho y qué te toca

Este repositorio trae **solo las pruebas unitarias**. Los otros dos niveles son tu
trabajo:

| Nivel | Dónde | Estado | Aísla |
|---|---|---|---|
| **Unitaria** | `src/**/*.test.js` junto al archivo que prueban (ej. `src/utils/pricing.test.js`, `src/repositories/cart.repository.test.js`) | ✅ Incluida | Todo — sin Express, sin HTTP, `../db` mockeado con `jest.mock` |
| **Componente** | `src/routes/*.routes.component.test.js` (convención sugerida) | ✍️ Lo escribes tú | Solo los repositories, mockeados con `jest.mock("../repositories/...")`; la ruta se prueba vía HTTP con `supertest` |
| **Integración / caja negra** | `tests/*.test.js` (Jest + Supertest) o `karate/*.feature` (Karate) | ✍️ Lo escribes tú | Nada: todo el stack real, incluidos `db.js` y `data.json` |

`npm test` corre `jest --runInBand` (en serie). Cuando escribas pruebas de integración
que comparten `data.json`, mantenlo así: en paralelo pisarían el estado entre ellas, y
llama a `POST /api/test/reset` al inicio de cada suite.

Las dependencias `supertest` y `@karatelabs/karate` ya están en `devDependencies`. Si
usas Karate, el proyecto trae un `.npmrc` con `ignore-scripts=true` por una limitación
del paquete; revisa su documentación para la configuración de la JVM (vía `jbang`).

**Nota sobre "prueba de componente":** en el syllabus ISTQB clásico, *component testing*
es sinónimo de *unit testing*. En la pirámide moderna (Fowler), un *component test* es
un nivel intermedio: se prueba una pieza desplegable completa a través de su interfaz
pública, con sus colaboradores externos reemplazados por dobles.

---

## Decisiones de diseño orientadas a QA

- **Sin BD real ni dependencias nativas**: fácil de levantar en un laboratorio/sala de
  clases; ejercicio propuesto (en los comentarios del código): migrar `db.js` a
  SQLite/Postgres **sin romper los contratos** de la API — el Repository pattern ya
  existente hace ese cambio localizado a `src/repositories/`, sin tocar rutas.
- **`POST /api/test/reset`**: hook explícito para tests reproducibles.
- **Lógica de negocio aislada** (`pricing.js`, `rut.js`): pruebas unitarias con
  valores límite.
- **Datos de seed variados**: distintos estados de cupón y niveles de stock entre los
  productos, listos para explorar casos negativos.

## Herramientas y stack

| Herramienta | Para qué |
|---|---|
| Express 4 | Servidor HTTP / routing |
| `jsonwebtoken` + `bcryptjs` | Auth JWT y hash de contraseñas |
| `dotenv`, `cors` | Config por `.env`, CORS |
| Jest | Test runner — unitarias incluidas; úsalo también para componente e integración |
| Supertest | Peticiones HTTP contra la app Express en el mismo proceso |
| Karate DSL (`@karatelabs/karate`, Gherkin) | Opcional: pruebas de caja negra por HTTP contra el servidor real |
| Repository pattern | `src/repositories/*` — aísla el acceso a datos de las rutas |
| Singleton | `db.js` — un único `state` compartido vía cache de módulos de Node |
| Unit of Work | `db.js: runInTransaction()` — colapsa varias escrituras en una sola |
