# Nivel: pruebas unitarias

**Qué deja real:** una función o una clase.
**Qué reemplaza por dobles:** todo lo demás.

Estas **ya están escritas**: 13 suites, 108 pruebas. Son tu base de la pirámide,
gratis. No hace falta que las toques, pero vale la pena leerlas: son el modelo
de cómo se ve una prueba de este nivel en este proyecto.

```
unitarias/
├── db.test.js
├── middleware/     auth.middleware.test.js
├── repositories/   los 9 repositories + unit-of-work
└── utils/          pricing.test.js · rut.test.js
```

Fíjate en `repositories/`: cada archivo empieza con

```js
jest.mock("../../../src/db", () => ({ getState: jest.fn(), persist: jest.fn() }));
```

Eso es el doble. El repository se prueba solo: no hay archivo, no hay disco, no
hay estado compartido. Por eso estas pruebas corren en un segundo y podrían
correr en paralelo sin pisarse.

**Cuándo escribir una nueva:** cuando agregues una regla de negocio. Si mañana
cambia el IVA o aparece un tipo de cupón, su unitaria va acá.

```bash
npm test -- tests/unitarias
```
