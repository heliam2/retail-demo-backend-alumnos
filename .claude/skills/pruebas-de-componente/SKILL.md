---
name: pruebas-de-componente
description: "Genera pruebas de COMPONENTE de servicio con Karate a partir del contrato openapi.yaml — la ruta real contra un doble, sin levantar el backend. Úsala cuando el alumno quiera probar un endpoint en aislamiento, derivar casos desde el contrato, escribir o ampliar un .feature en tests/componentes/, o crear un mock de Karate. No la uses si la prueba necesita el stack real (esa es pruebas-de-integracion) ni si pasa por el navegador (esa es pruebas-e2e, en el repo del frontend)."
---

# Pruebas de componente con Karate, a partir del contrato

Tu trabajo no es producir muchos escenarios. Es producir **pocos escenarios que
no mientan**, en el nivel correcto, y dejarlos ejecutados.

## Paso 1 · Confirma que este es el nivel

Antes de escribir una línea, pregunta —o deduce del pedido— **qué queda real y
qué se reemplaza por un doble**. Esa respuesta, y no la herramienta, define el
nivel:

| Lo que el alumno quiere verificar | Nivel | Dónde |
|---|---|---|
| Una función pura (cálculo, validación) | unitaria | Jest, `tests/unitarias/` |
| Que la ruta hable bien el contrato, con todo lo demás doblado | **componente** | **acá** |
| Que las piezas reales calcen entre sí | integración | `pruebas-de-integracion` |
| Que la pantalla pida y muestre bien | E2E | repo del frontend |

**Si lo que quiere verificar es un cálculo real —que el IVA se aplique sobre el
neto, que el descuento redondee bien—, una prueba de componente NO sirve**: el
doble devuelve lo que vos le dijiste que devolviera. Dilo y redirige al nivel
que corresponde. Esto no es una formalidad: es el error más común.

## Paso 2 · Lee el contrato y los datos que ya existen

1. `openapi.yaml` — la ruta, sus parámetros, **todos** los códigos de respuesta
   declarados y el esquema de cada uno.
2. `tests/karate-config.js` — `usuarios`, `cupones`, `productos`, `reglas`.
3. `tests/componentes/demo-clase11/` — el ejemplo visto en clase.

**Nunca escribas a mano `EXPIRADO`, `cliente@demo.cl` ni el id `9`.** Pídelos a
`karate-config.js`. Si un dato que necesitas no está ahí, agrégalo ahí y úsalo
desde la feature: si mañana cambia el seed, se toca un archivo y ninguno más.

## Paso 3 · Deriva los casos del contrato, no de la imaginación

Del contrato salen los casos, en este orden:

1. **Un caso por código de respuesta declarado.** Si el contrato declara 200,
   400 y 401, son tres casos. Ni más ni menos.
2. **Una clase de equivalencia por cada razón distinta** del mismo código. Cuatro
   motivos distintos de 400 son cuatro filas, no cuatro escenarios.
3. **Los valores límite** de cada restricción (`minimum`, `maxLength`, umbrales
   del negocio): el valor justo abajo, el exacto y el justo arriba.

## Paso 4 · La regla del oráculo — la más importante

> **Si el contrato no define el resultado esperado, no lo inventes.**

Cuando el contrato declara un 400 pero no dice qué mensaje devuelve, o no define
qué pasa cuando fallan dos condiciones a la vez:

- **asevera solo lo que el contrato sí define** (el código de estado);
- **no asevera** el mensaje;
- deja el hueco anotado y dirigido a quien lo resuelve:

```gherkin
# PENDIENTE (Negocio): el contrato no define que mensaje se informa cuando
# el cupon esta vencido Y ademas no alcanza el monto minimo. Sin esa regla
# no hay resultado esperado, y una prueba sin oraculo hay que reescribirla.
```

Inventar el oráculo es peor que no tener la prueba: queda verde contra el
comportamiento actual y bendice como correcto lo que nadie aprobó.

## Paso 5 · Una mecánica, muchos datos

> **Si dos escenarios se diferencian solo en los datos, son UN `Scenario Outline`
> con una tabla `Examples`, no dos escenarios.**

Antes de escribir el segundo escenario, compáralo con el primero. Si los pasos
`Given/When/Then` son iguales y solo cambian los valores, es una fila más.

Quince escenarios copiados son quince lugares que tocar el día que cambie la
ruta. Una tabla de quince filas es uno.

## Paso 6 · Escribe el doble y la prueba

El doble (`api-mock.feature`) **lleva siempre `@ignore`**: es un servidor, no una
prueba, y sin esa etiqueta Karate lo ejecuta como si lo fuera.

Etiqueta la feature con `@componente` para que el pipeline la seleccione.

```gherkin
@componente
Feature: <qué regla se verifica, en una línea>

  Background:
    * def server = karate.start({ mock: 'api-mock.feature', port: 0 })
    * url 'http://localhost:' + server.port + '/api'
    # ... login y preparación
```

### Las dos trampas de Karate que cuestan una hora

Las dos aparecen al mandar el token, y a todos les pasan:

1. **`* header X = ...` aplica solo a la petición siguiente.** La primera se lo
   lleva y las demás salen sin token → 401 sin que haya defecto. Usa
   `* configure headers = { ... }`, que sí persiste.
2. **`#(expr)` se evalúa solo si ocupa el valor completo.** `'Bearer #(token)'`
   viaja literalmente así. Concatena antes:

```gherkin
* def authHeader = 'Bearer ' + token
* configure headers = { Authorization: '#(authHeader)' }
```

## Paso 7 · Ejecuta, y después demuestra que puede fallar

```bash
npm run karate -- --tags @componente
```

No necesita el backend corriendo. **Compruébalo apagándolo**: si la prueba falla
sin el servidor, no es una prueba de componente.

Y después, el paso que casi nadie da:

> **Rompe la aserción a propósito y confirma que se pone roja.**
> Cambia un `200` por un `201`, o el mensaje esperado por cualquier otro.

Una prueba que nunca viste fallar no sabes si verifica algo. Restaura el valor
cuando termines.

## Antes de dar la prueba por terminada

- [ ] Cada aserción sale del contrato, ninguna de la imaginación
- [ ] Lo que el contrato no define quedó anotado, no aseverado
- [ ] No hay dos escenarios que difieran solo en datos
- [ ] Ningún dato está escrito a mano; todos vienen de `karate-config.js`
- [ ] El mock tiene `@ignore` y la feature tiene `@componente`
- [ ] Corre con el backend apagado
- [ ] La viste fallar
