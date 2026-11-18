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
npm run karate                        # todas las features de tests/
npm run karate -- tests/integracion   # solo un nivel
npm run karate -- --tags @componente  # por etiqueta
```

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
