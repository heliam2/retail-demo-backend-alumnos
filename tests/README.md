# `tests/` — pruebas organizadas por nivel

Todo lo que es prueba vive acá. `src/` queda solo con código de producción.

```
tests/
├── unitarias/      ya incluidas (13 suites, 108 pruebas)
├── componentes/    ✍️ las escribes tú
├── integracion/    ✍️ las escribes tú
├── e2e/            viven en el repositorio del frontend
├── helpers/        datos y utilidades compartidas
├── karate-config.js    configuración de Karate (ambiente + datos)
└── run-karate.js       lanzador de Karate
```

La carpeta dice el **nivel**, no la herramienta. En un mismo nivel pueden
convivir un `.test.js` de Jest y un `.feature` de Karate: lo que define el nivel
no es con qué lo escribiste, sino **qué dejaste real y qué reemplazaste por un
doble**.

---

## Qué va en cada nivel

| Nivel | Qué deja real | Qué reemplaza por dobles | Estado |
|---|---|---|---|
| **unitarias** | Una función o una clase | Todo lo demás | ✅ 108 incluidas |
| **componentes** | Una ruta HTTP | Los repositories (`jest.mock`) o el servicio entero (mock de Karate) | ✍️ tuyas |
| **integracion** | Todo el stack: rutas → repositories → `db.js` → `data.json` | Nada | ✍️ tuyas |
| **e2e** | El sistema completo, a través de la interfaz | Nada | 👉 repositorio del frontend |

---

## Cómo correr cada nivel

```bash
npm test                              # todas las de Jest (hoy: las unitarias)
npm test -- tests/unitarias           # solo un nivel
npm test -- pricing                   # por nombre de archivo

npm run dev                           # en otra terminal: la API en el 4000

npm run karate                                              # todas las features
npm run karate -- tests/integracion                         # solo un nivel
npm run karate -- tests/integracion/demo-clase11/cupones.feature   # un archivo
npm run karate -- --tags @componente                        # por etiqueta
```

El reporte HTML queda en `target/karate-reports/karate-summary.html`.

> **Dos trampas al escribir features en Karate, y las dos dan 401:**
>
> `* header Authorization = ...` aplica **solo a la petición siguiente**: la
> primera se lo lleva y las demás salen sin token. Para que persista en todo el
> escenario hay que usar `* configure headers = { ... }`.
>
> Y una expresión `#(...)` se evalúa **solo si ocupa el valor completo**. Dentro
> de un texto más largo, `'Bearer #(token)'` viaja literalmente así, con el
> `#(token)` sin reemplazar. Hay que concatenar antes:
> `* def authHeader = 'Bearer ' + token` y luego `'#(authHeader)'`.

> El doble `componentes/demo-clase11/api-mock.feature` lleva la etiqueta
> `@ignore`: es un servidor, no una prueba, y sin esa etiqueta Karate lo
> ejecutaria como si lo fuera. `contra-doble.feature` lo levanta igual con
> `karate.start()`.

> La primera corrida de Karate descarga jbang y el jar 1.5.2: puede tardar un
> par de minutos. Las siguientes son inmediatas.

---

## Por qué las unitarias ya no están junto al código

Antes vivían al lado de lo que prueban (`src/utils/pricing.test.js`). Las dos
convenciones son válidas y se usan en la industria. Acá se eligió separarlas por
una razón concreta: **que el nivel de una prueba se vea en su ruta.**

Si tienes que decidir dónde poner una prueba nueva, la pregunta «¿qué dejo real
y qué doblo?» te lleva directo a la carpeta. Y al revés: viendo la ruta de una
prueba sabes qué garantiza sin abrirla.

Los imports se recalcularon uno por uno y las 108 pruebas pasan igual que antes.

---

## Las capas, en este repositorio

La clase 11 describe seis capas de una solución de automatización. Acá están:

| Capa | Dónde |
|---|---|
| 1 · Configuración y ambientes | `karate-config.js` · `.env` |
| 2 · Datos de prueba | `helpers/datos.js` · `karate-config.js` · `POST /api/test/reset` |
| 3 · Acceso al sistema | el cliente HTTP de Karate · `supertest` |
| 4 · Acciones de negocio | ✍️ tuya: extráela cuando repitas el mismo `login` por tercera vez |
| 5 · Pruebas | los `.test.js` y `.feature` de cada nivel |
| 6 · Ejecución y reporte | `run-karate.js` · los scripts de `package.json` |

---

## Las carpetas `demo-clase11/`

Dentro de `componentes/` e `integracion/` hay una carpeta `demo-clase11/` con
los ejemplos que se leen en clase. **No son tu laboratorio**: están para que
puedas ejecutarlos y leerlos. Tu trabajo va directamente en el nivel que
corresponda, fuera de esa carpeta.

Los dos ejemplos que conviene comparar son:

- `integracion/demo-clase11/cupones.feature`
- `componentes/demo-clase11/contra-doble.feature`

Verifican **lo mismo**, con la **misma herramienta**. Lo único que cambia es a
dónde apunta `url`: el sistema real en uno, un doble en el otro. Y eso cambia el
nivel. Compruébalo apagando `npm run dev` y corriendo
`npm run karate -- --tags @componente`: pasa igual, porque no necesita el backend.

---

## `contrato/` — el gate de contrato (clase 12)

`contrato/openapi-vs-rutas.test.js` compara dos artefactos que tienen que decir
lo mismo: el `openapi.yaml` que publicamos y las rutas que Express tiene
realmente montadas. Hoy son 35 contra 35.

No levanta el servidor y no hace una sola peticion HTTP: lee el contrato y le
pregunta a Express. Por eso tarda **0,8 segundos** y puede vivir en la etapa de
commit del pipeline, junto a las unitarias.

```bash
npm run test:contrato
```

Compruebalo: agrega `router.post("/cancel", ...)` en
`src/routes/orders.routes.js`, no toques el `openapi.yaml`, y vuelve a correrlo.
El gate se pone rojo nombrando la ruta.

> **Precision importante:** esto es una verificacion **estatica de consistencia
> entre codigo y contrato** (drift). NO es contract testing dirigido por el
> consumidor (Pact), que es lo que la industria llama "contract testing" sin
> calificar: ahi se verifican las expectativas de un consumidor concreto contra
> las respuestas reales del proveedor. Esta prueba es mas barata y mas limitada:
> detecta que el contrato quedo desactualizado, no que un consumidor se rompa.

---

## El pipeline (clase 12)

`.github/workflows/pipeline.yml` y el `Jenkinsfile` hacen lo mismo con
herramientas distintas:

```
ETAPA 1 · COMMIT        lint · unitarias · contrato · sast · dependencias
(en paralelo, < 5 min)  nada de esto levanta nada
         |
ETAPA 2 · COMPONENTE    componentes          (levanta un doble)
         |
ETAPA 3 · INTEGRACION   integracion          (levanta la API real)
         |
PUERTA                  decide con lo que midieron los gates
```

La regla que ordena las etapas es la misma de la clase 11, movida un nivel:
**la etapa la determina lo que la prueba necesita tener en pie**, no la
herramienta. La prueba esta en el YAML: los jobs `componentes` e `integracion`
corren el mismo Karate, y la unica diferencia entre los dos es que uno tiene la
linea `npm run dev` y el otro no. **Esa ausencia es el nivel de prueba.**

---

## Certificacion y produccion (clase 12)

`.github/workflows/entrega.yml` es la segunda mitad del pipeline. `pipeline.yml`
responde *«¿este commit es publicable?»*; `entrega.yml` responde *«¿lo
publicamos, donde, y quien lo autoriza?»*.

```
pipeline.yml ──verde──> ARTEFACTO ──> CERTIFICACION ──> PRODUCCION
                        se construye   automatico       REQUIERE
                        UNA sola vez                    APROBACION
```

El job `produccion` declara `environment: produccion`. Si ese Environment
tiene "Required reviewers" configurado en GitHub, **el pipeline se detiene ahi
y espera a que una persona apruebe**. Esa casilla es, literalmente, la
diferencia entre las dos CD:

| | Con revisor | Sin revisor |
|---|---|---|
| | Continuous **Delivery** | Continuous **Deployment** |
| Quien publica | una persona | nadie |

Se cambia de una a la otra marcando una casilla, sin tocar el YAML.

**Modo simulacion.** Sin los secrets de despliegue, los jobs no fallan: avisan
que corren en modo simulacion y siguen. El flujo completo y la pausa de
aprobacion se ven igual, sin tener ningun servidor.

**El smoke espera la version nueva, no una respuesta.** `/api/health` informa
el commit desplegado, y el smoke espera a ver *ese* commit. Conformarse con un
200 da verde sobre el codigo anterior mientras el despliegue todavia avanza:
un falso verde que ademas oculta un despliegue fallido.
