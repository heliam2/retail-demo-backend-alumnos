# Skills para acelerar sus pruebas

Estas carpetas son **skills**: instrucciones que Claude carga sola cuando le
pides algo que encaja con su descripcion. No hay que instalar nada: vienen en
el repositorio, asi que con clonarlo ya las tienen.

| Skill | Para que sirve |
|---|---|
| `pruebas-de-componente` | Deriva casos del `openapi.yaml` y escribe una feature de Karate contra un **doble**. No necesita el backend corriendo |
| `pruebas-de-integracion` | Escribe una feature de Karate contra el **stack real**: rutas, repositories, `db.js` y `data.json` |
| `revisar-prueba` | Revisa una prueba ya escrita y busca las formas en que una prueba verde puede estar mintiendo |

Para las pruebas E2E con Playwright, las skills estan en el repositorio del
**frontend**.

## Como se usan

Basta con pedirlo en palabras. Los tres ejemplos:

> «Escribime las pruebas de componente del endpoint de direcciones a partir del contrato»

> «Necesito una prueba de integracion que verifique que al cancelar un pedido se devuelve el stock»

> «Revisa `tests/integracion/mis-cupones.feature` antes de que lo entregue»

Tambien se pueden invocar por nombre, con `/pruebas-de-componente`.

## Lo que estas skills NO hacen

No generan cuarenta escenarios de una. Estan escritas a proposito para lo
contrario:

- **preguntan primero en que nivel va la prueba**, y te mandan a otra skill si
  te equivocaste de nivel;
- **se niegan a inventar un resultado esperado** que el contrato no defina: lo
  dejan anotado como pendiente y dirigido a quien lo resuelve;
- **colapsan a una tabla** lo que serian varios escenarios iguales con datos
  distintos;
- **te piden ejecutarla y despues romperla**, para que compruebes que puede
  fallar.

Una prueba que nunca viste fallar no sabes si verifica algo. Esa es la idea que
sostiene las tres.
