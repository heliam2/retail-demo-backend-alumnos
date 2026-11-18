# Nivel: pruebas de integración ✍️

**Qué deja real:** todo el stack — rutas → repositories → `db.js` → `data.json`.
**Qué reemplaza por dobles:** nada.

Este nivel **lo escribes tú**. El proyecto no trae ninguna.

Es el nivel que verifica lo que ningún otro puede: que las piezas reales
**calzan**. Una suite de componente puede estar entera en verde con un contrato
que ya cambió; esta no.

## Dos formas, las dos válidas

**Con Jest + Supertest** contra la app real:
`tests/integracion/<flujo>.test.js`

**Con Karate** contra el servidor corriendo:
`tests/integracion/<flujo>.feature` — el ejemplo está en `demo-clase11/`.

## El costo de este nivel, y cómo se paga

Estas pruebas comparten `data.json`. Dos corriendo a la vez se pisarían el
estado, y por eso:

- `npm test` corre con `--runInBand` (en serie)
- el hook `POST /api/test/reset` devuelve el sistema al seed conocido

**Llama al reset al inicio de cada suite.** Sin eso, el orden de ejecución
empieza a importar, y una prueba que falla sola pero pasa acompañada es el peor
defecto que te puede tocar depurar.

Ese estado compartido es el **techo de escalabilidad** de esta solución: hoy no
duele, el día que haya cientos de pruebas sí. No se arregla con una máquina más
grande — se arregla cambiando la estrategia de datos para que cada prueba cree
lo suyo.

```bash
npm run dev                            # el backend tiene que estar arriba
npm test -- tests/integracion
npm run karate -- tests/integracion
```
