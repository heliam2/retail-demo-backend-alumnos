# Nivel: pruebas end-to-end

**Qué deja real:** el sistema completo, a través de la interfaz de usuario.
**Qué reemplaza por dobles:** nada.

## Acá no hay ninguna, y es a propósito

Las pruebas E2E de ChileRetail pasan por la pantalla, así que viven en el
**repositorio del frontend**, junto al código que manejan:

```
retail-demo-frontend-alumnos/tests/e2e/
```

Están escritas con Playwright y usan este backend corriendo en el puerto 4000.

## Entonces, ¿esta carpeta para qué sirve?

Para cuando quieras un E2E **a nivel de API**: un recorrido completo del negocio
—registrarse, buscar, agregar al carro, cotizar, pagar, consultar el pedido—
contra el sistema real y sin ningún doble.

La diferencia con `integracion/` es de alcance, no de técnica: integración
verifica *un flujo*, E2E verifica *un recorrido completo del usuario*.

## Y una advertencia que vale más que la carpeta

Este es el nivel más caro de todos: el más lento, el más frágil y el que peor
localiza un fallo. Antes de escribir uno acá, pregúntate si la misma garantía
no la consigues un nivel más abajo, donde cuesta diez veces menos.

Pocos y muy bien elegidos.
