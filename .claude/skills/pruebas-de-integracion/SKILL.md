---
name: pruebas-de-integracion
description: "Genera pruebas de INTEGRACIÓN de servicio con Karate contra el stack real — rutas, repositories, db.js y data.json, sin dobles. Úsala cuando el alumno quiera verificar que las piezas reales calzan, probar un cálculo de verdad, comprobar persistencia o efectos de lado, o escribir un .feature en tests/integracion/. No la uses si todo va doblado (esa es pruebas-de-componente) ni si pasa por el navegador (esa es pruebas-e2e, en el repo del frontend)."
---

# Pruebas de integración con Karate, contra el sistema real

Acá no hay dobles: ruta → repository → `db.js` → `data.json`, todo real. Es más
lenta y más cara que una de componente, así que **tiene que ganarse el lugar**.

## Paso 1 · Confirma que este nivel se justifica

La pregunta que decide:

> **¿Qué verifica esto que una prueba de componente NO podría verificar?**

Si no hay respuesta, bájala de nivel. Las respuestas que sí justifican estar acá:

| Qué verifica | Por qué un doble no sirve |
|---|---|
| Un cálculo real (IVA sobre el neto, redondeo del descuento) | el doble devuelve lo que le dijiste que devolviera |
| Que algo quedó persistido | el doble no escribe nada |
| Que un rechazo **no dejó rastro** | el doble no tiene estado que ensuciar |
| Que dos endpoints reales ven lo mismo | cada doble vive en su burbuja |
| Un código de error que produce el stack, no la ruta | el doble lo simula |

Si el alumno quiere verificar «que la ruta responde 401 sin token», eso es
componente: no hace falta levantar nada.

## Paso 2 · Lee lo que ya existe

- `tests/karate-config.js` — `baseUrl`, `usuarios`, `cupones`, `productos`, `reglas`
- `tests/integracion/demo-clase11/` — los dos ejemplos de clase
- `openapi.yaml` — el contrato, para no aseverar lo que no está declarado

**Nunca escribas datos a mano.** Si falta uno, agrégalo a `karate-config.js`.

## Paso 3 · El `Background` siempre deja el sistema en estado conocido

La persistencia es un `data.json` compartido. Sin reset, el carro trae productos
de la corrida anterior y los totales no cuadran — y el alumno pierde media hora
buscando un defecto que no existe.

```gherkin
@integracion
Feature: <qué regla real se verifica>

  Background:
    * url baseUrl

    Given path 'test/reset'
    When method post
    Then status 200

    Given path 'auth/login'
    And request { email: '#(usuarios.cliente.email)', password: '#(usuarios.cliente.password)' }
    When method post
    Then status 200
    * def token = response.token

    * def authHeader = 'Bearer ' + token
    * configure headers = { Authorization: '#(authHeader)' }
```

### Las dos trampas de Karate

1. **`* header X = ...` aplica solo a la petición siguiente** → usa
   `* configure headers`, que sí persiste en el escenario.
2. **`#(expr)` se evalúa solo si ocupa el valor completo** → `'Bearer #(token)'`
   viaja literal. Concaténalo antes, como arriba.

Las dos dan 401 sin que haya ningún defecto real.

## Paso 4 · El patrón que hace valiosa una prueba de integración

Verificar que el error aparece es la mitad fácil. **La otra mitad es verificar
que el rechazo fue completo**, y es donde se encuentran los defectos de verdad:

```gherkin
  Scenario: Un cupon expirado es rechazado y no altera el total

    # 1 · la referencia, ANTES de tocar nada
    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    * def totalSinCupon = response.total

    # 2 · el rechazo
    Given path 'orders/quote'
    And request { couponCode: '#(cupones.expirado)' }
    When method post
    Then status 400
    And match response.error == 'Cupon expirado'

    # 3 · LA VERIFICACION QUE IMPORTA: no quedó aplicado
    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    And match response.total == totalSinCupon
```

El paso 3 es el caso de prueba. Un sistema que guardara el cupón rechazado se
comportaría igual en los pasos 1 y 2, y solo ahí se delataría.

**Aplica el mismo molde a cualquier rechazo:** guardar el estado antes,
provocar el rechazo, comprobar que el estado no cambió.

## Paso 5 · Una mecánica, muchos datos

> Si dos escenarios se diferencian solo en los datos, son **un
> `Scenario Outline`** con tabla `Examples`.

Agregar un quinto caso tiene que costar una línea de tabla, no un escenario.
Usa una columna `nota` para documentar qué clase de equivalencia es cada fila.

## Paso 6 · La regla del oráculo

> **Si el contrato o la regla de negocio no definen el resultado, no lo inventes.**

Y acá hay una trampa propia de este nivel: **el sistema real siempre responde
algo**. Esa respuesta es *comportamiento observado*, no requisito.

- Si el contrato lo define → asevéralo.
- Si no → anótalo como pendiente, dirigido a quien lo resuelve, y no lo
  asevere.

```gherkin
# PENDIENTE (Arquitectura): hoy el sistema responde "Cupon no existe" cuando
# fallan varias condiciones a la vez, porque las guardas son secuenciales.
# Eso es lo que HACE, no lo que DEBE hacer. Confirmar antes de aseverarlo.
```

Aseverar el comportamiento observado convierte la implementación en
especificación, y congela el defecto si lo hubiera.

## Paso 7 · Ejecuta

```bash
npm run dev                            # en otra terminal
npm run karate -- tests/integracion    # acá
```

El reporte queda en `target/karate-reports/karate-summary.html`.

> La primera corrida descarga jbang y el jar de Karate: tarda un par de
> minutos. Las siguientes son inmediatas.

Y después, **rompe una aserción a propósito y confirma que se pone roja**. Una
prueba que nunca viste fallar no sabes si verifica algo.

## Antes de darla por terminada

- [ ] Puedes nombrar qué verifica que una de componente no podría
- [ ] El `Background` hace `test/reset`
- [ ] Usa `configure headers`, no `header`
- [ ] Si verifica un rechazo, comprueba que no dejó rastro
- [ ] No hay dos escenarios que difieran solo en datos
- [ ] Ningún dato escrito a mano
- [ ] Nada aseverado que el contrato no defina
- [ ] La viste fallar
