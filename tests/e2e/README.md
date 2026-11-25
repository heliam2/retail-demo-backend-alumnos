# Nivel: pruebas end-to-end

**Qué deja real:** el sistema completo, desplegado, con su configuración.
**Qué reemplaza por dobles:** nada.

## Acá hay exactamente una

`flujo-de-compra.feature` — un recorrido completo del negocio contra la API:
registrarse, mirar el catálogo, agregar al carro, cotizar, pagar y encontrar el
pedido en el historial. Cruza cuatro módulos en una sola secuencia donde cada
paso depende del anterior.

**Una, y a propósito una.** Es el nivel más caro: el más lento, el más frágil y
el que peor localiza un fallo. Antes de escribir la segunda, pregúntate si la
misma garantía no la consigues un nivel más abajo, donde cuesta diez veces
menos. Pocos y muy bien elegidos.

Las E2E **por pantalla** siguen viviendo en el repositorio del frontend
(`retail-demo-frontend-alumnos/tests/e2e/`), con Playwright. Esta es a nivel de
API: mismo alcance de negocio, sin navegador.

## Dónde corre

Contra el **ambiente de certificación ya desplegado**, en `entrega.yml`, no en
el pipeline de commit. Es la única prueba del proyecto que puede fallar por una
causa de despliegue —una variable que falta, una base mal apuntada, una versión
que no subió— en lugar de por un defecto del código.

```bash
# local
npm run karate -- tests/e2e

# contra un ambiente desplegado
BASE_URL=https://mi-ambiente.onrender.com/api npm run karate -- tests/e2e
```

## Está escrita distinto al resto, y la diferencia es el punto

Correr en un ambiente compartido y vivo impone tres reglas que las pruebas de
integración de este repositorio no cumplen:

| | Integración (`tests/integracion/`) | Este E2E |
|---|---|---|
| Resetea la base | sí, llama a `/api/test/reset` | **no** |
| De dónde saca el usuario | del seed | **lo crea, con correo único** |
| De dónde saca el producto | id fijo | **se lo pregunta al catálogo** |

Las tres salen del mismo razonamiento: **una prueba que exige quedarse sola con
el ambiente no sirve en un ambiente real.** Resetear la base le borra los datos
a quien esté trabajando ahí; depender del seed la rompe en cuanto alguien toca
un dato; un id fijo se queda sin stock y empieza a fallar sin que haya defecto.

## Lo que esta prueba consume

Cada corrida crea un usuario y descuenta stock de verdad. Eso no es un descuido:
es lo que cuesta probar en un ambiente real, y hay que decidirlo a conciencia.
En certificación sobre Render el disco es efímero y el seed vuelve solo en cada
despertar, así que se limpia sin que nadie haga nada. En un ambiente que
persiste, esto se planifica: datos de prueba identificables, una ventana de
limpieza, o una cuenta de servicio para automatización.

Lo que **no** se hace es correr este viaje en producción. Crea órdenes reales.
