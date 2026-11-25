---
name: revisar-prueba
description: "Revisa una prueba automatizada ya escrita (Jest, Karate o Playwright) y detecta si miente, si está en el nivel equivocado, si no puede fallar, si duplica escenarios o si depende de datos escritos a mano. Úsala cuando el alumno pida revisar, mejorar, auditar o dar feedback sobre una prueba suya, cuando una prueba pase siempre, o antes de entregar una suite."
---

# Revisar una prueba automatizada

Una prueba en verde no prueba nada por sí sola. Esta revisión busca **las
formas en que una prueba verde puede estar mintiendo**.

Revisa en este orden: los tres primeros puntos descalifican la prueba; el resto
la mejoran.

---

## 1 · ¿Asevera algo? (el Liar)

> Una prueba que ejecuta código sin comprobar el resultado pasa siempre, y
> cuenta como cobertura.

Busca:

- escenarios sin `match` / `expect` / `Then status`;
- un `Then status 200` como única aserción de un caso que promete verificar una
  regla de negocio;
- un `expect` sobre algo que no puede ser falso (`expect(res).toBeDefined()`);
- Playwright: `await page.click(...)` y nada después.

**Señal clave:** si el nombre promete «el cupón expirado no cambia el total» y
las aserciones solo miran el código de estado, la prueba no verifica lo que
dice.

## 2 · ¿Puede fallar?

Es el único chequeo que da certeza, y el que nadie hace.

> **Rompe la aserción a propósito y córrela.**
> Cambia el valor esperado, o el código de estado, por cualquier otro.

Si sigue verde, la prueba no está verificando lo que crees. Restaura el valor
después.

### El caso traicionero: aseverar contra el propio código

```js
expect(res.subtotal).toBe(FREE_SHIPPING_THRESHOLD);
```

Esta prueba importa la constante **del módulo que está probando**. Si alguien
cambia el umbral, sigue verde. Cobertura: 100 %. Capacidad de detectar un umbral
equivocado: cero.

> **Una prueba unitaria no puede validar un requisito que importa del código.**
> El valor esperado tiene que venir de otro lado: del requisito, de una tabla
> de datos, o de una constante de prueba independiente.

Marca esto siempre que lo veas. Es el defecto más silencioso de todos.

## 3 · ¿Está en el nivel correcto?

Mira **qué necesita tener levantado** para correr, no con qué está escrita:

| Necesita | Nivel | Dónde debería vivir |
|---|---|---|
| nada | unitaria | `tests/unitarias/` |
| un doble | componente | `tests/componentes/` |
| la API real | integración | `tests/integracion/` |
| el sistema completo | E2E | repo del frontend |

Dos errores frecuentes:

- **Una prueba de E2E que verifica una regla de cálculo.** Paga minutos por lo
  que abajo cuesta milisegundos, y cuando falla no dice dónde está el problema.
  Propón bajarla y deja arriba solo «que la pantalla pida y muestre bien».
- **Una prueba de componente que verifica un cálculo real.** El doble devuelve
  lo que le dijeron: esa prueba no puede detectar un cálculo mal hecho.

## 4 · ¿Duplica escenarios que son una tabla?

> Si dos escenarios se diferencian **solo en los datos**, son un
> `Scenario Outline` con `Examples` (Karate) o un bucle sobre un arreglo de
> casos (Jest/Playwright).

Compara los pasos de los escenarios de a pares. Quince escenarios copiados son
quince lugares que tocar cuando cambie la ruta; una tabla de quince filas es
uno.

Cuenta también la duplicación de comentarios: un bloque repetido quince veces
palabra por palabra es la misma señal.

## 5 · ¿Los datos están escritos a mano?

Busca literales: `'EXPIRADO'`, `cliente@demo.cl`, `9`, `18990`, `/cart`,
`data-testid` sueltos.

Cada uno debería venir de su capa:

| Repo | Dónde viven los datos |
|---|---|
| backend | `tests/karate-config.js` · `tests/helpers/datos.js` |
| frontend | `tests/e2e/demo-clase11/datos/fixtures.js` |

La pregunta: *si mañana cambia el seed, ¿cuántos archivos hay que tocar?* Si la
respuesta es más de uno, falta extraer.

## 6 · ¿Es independiente y repetible?

- **¿Deja el sistema en estado conocido antes de empezar?** En integración y
  E2E, `test/reset` en el `Background` / `beforeEach`. Sin eso, la prueba pasa
  sola y falla en la suite.
- **¿Depende de que otra prueba haya corrido antes?** Si el orden importa, no es
  independiente.
- **¿Puede correr dos veces seguidas?** Una prueba que crea un registro con un
  identificador fijo falla la segunda vez.

## 7 · ¿Espera por una condición o por el reloj?

```js
await page.waitForTimeout(3000);   // mal
sleep 10                           // mal
```

Un tiempo fijo es la causa número uno de pruebas intermitentes: a veces alcanza
y a veces no. Y una prueba intermitente **es peor que no tener la prueba**,
porque enseña a la gente a apretar «re-run» — y después también lo aprietan
cuando la falla es verdadera.

Reemplaza por una espera por condición: `expect(...).toBeVisible()`,
`waitForURL`, o un bucle sobre un health check.

## 8 · ¿El nombre dice lo que verifica?

El nombre es lo único que va a leer quien vea la prueba fallar en el pipeline.
Si dice «test cupones» o «caso 3», no sirve. Si dice «el cupón expirado no
cambia el total», cualquiera entiende qué se rompió.

## 9 · ¿Asevera algo que nadie aprobó?

Si la prueba comprueba un mensaje, un umbral o un código que **el contrato no
declara**, está convirtiendo el comportamiento actual en requisito.

- Si el contrato lo define → bien.
- Si no → quitar esa aserción y anotar el pendiente, dirigido a quien lo
  resuelve (Negocio, Arquitectura, Data, Ciberseguridad).

Esto pasa sobre todo en integración, donde el sistema real **siempre** responde
algo: esa respuesta es comportamiento observado, no especificación.

---

## Cómo entregar la revisión

Para cada hallazgo, tres líneas:

1. **Qué está mal**, citando el archivo y la línea.
2. **Por qué importa** — qué defecto se escaparía.
3. **Cómo se arregla**, con el código corregido.

Y al final, **un veredicto de una línea**: ¿esta prueba se puede llevar al
pipeline como gate bloqueante, o todavía no?

Si no encuentras nada en los puntos 1, 2 y 3, dilo: una prueba bien escrita
merece que se lo digan. No inventes hallazgos para llenar la lista.
