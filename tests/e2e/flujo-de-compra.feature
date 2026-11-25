@e2e
Feature: E2E de backend - el viaje completo de una compra

  # NIVEL: prueba END TO END a nivel de backend.
  #
  # Que la hace E2E y no de integracion: no verifica una regla de negocio
  # aislada, sino una TRANSACCION DE NEGOCIO COMPLETA de principio a fin
  # -registrarse, comprar, encontrar la orden-, cruzando cuatro modulos
  # (auth, catalogo, carro, ordenes) en una sola secuencia donde cada paso
  # depende del anterior. Si cualquiera de los cuatro se cae, esta prueba
  # falla. Ninguna otra prueba del proyecto cubre ese recorrido.
  #
  # "A nivel de backend" porque el recorrido se hace por HTTP contra la API,
  # sin navegador. El E2E con navegador vive en el repositorio del frontend.
  #
  # DONDE CORRE: contra el ambiente de CERTIFICACION ya desplegado, no contra
  # una API levantada en el runner. Es la unica prueba del proyecto que puede
  # afirmar algo sobre el DESPLIEGUE y no solo sobre el codigo.
  #
  # POR ESO ESTA ESCRITA DISTINTO al resto, y vale leer la diferencia:
  #
  #   - NO llama a /api/test/reset. En un ambiente compartido, resetear la
  #     base le borra los datos a quien este trabajando ahi. Una prueba que
  #     exige quedarse sola con el ambiente no sirve en un ambiente real.
  #
  #   - Se crea SU PROPIO usuario, con un correo distinto en cada corrida.
  #     Asi no depende del seed, no choca con otra corrida simultanea, y
  #     puede correr mil veces sin ensuciar a nadie.
  #
  #   - Elige el producto EN TIEMPO DE EJECUCION, preguntandole al catalogo.
  #     Un id fijo funciona contra un seed conocido; contra un ambiente vivo
  #     se queda sin stock y la prueba empieza a fallar sin que haya defecto.

  Background:
    * url baseUrl

    # Correo irrepetible: milisegundos + un sufijo aleatorio, por si dos
    # corridas arrancan en el mismo milisegundo.
    * def marca = '' + java.lang.System.currentTimeMillis() + '-' + Math.floor(Math.random() * 10000)
    * def correo = 'e2e-' + marca + '@demo.cl'
    * def clave = 'E2eDemo1234'


  Scenario: Un cliente nuevo se registra, compra y encuentra su orden en el historial

    # ------------------------------------------------------------------
    # 1 - El cliente se registra. El ambiente tiene que estar vivo, con la
    #     base escribible y el JWT bien configurado: si falta cualquiera de
    #     las tres cosas, el viaje se corta aca.
    # ------------------------------------------------------------------
    Given path 'auth', 'register'
    And request { email: '#(correo)', password: '#(clave)', name: 'Cliente E2E' }
    When method post
    Then status 201
    And match response.token == '#string'
    And match response.user.email == correo
    And match response.user.role == 'customer'
    * def token = response.token
    * def authHeader = 'Bearer ' + token
    * configure headers = { Authorization: '#(authHeader)' }

    # ------------------------------------------------------------------
    # 2 - Mira el catalogo y elige. El filtro pide stock de sobra y precio
    #     sobre el umbral de envio gratis, para que el paso 4 tenga algo
    #     que verificar.
    # ------------------------------------------------------------------
    Given path 'products'
    When method get
    Then status 200
    And match response == '#[_ > 0]'

    * def sirve = function(p) { return p.stock > 2 && p.price >= reglas.umbralEnvioGratis }
    * def candidatos = karate.filter(response, sirve)
    * assert candidatos.length > 0
    * def producto = candidatos[0]
    * print 'Producto elegido:', producto.name, '- precio', producto.price, '- stock', producto.stock

    # ------------------------------------------------------------------
    # 3 - El carro de un usuario recien creado tiene que estar vacio.
    #     Es la prueba de que el carro esta aislado por usuario: si saliera
    #     con algo adentro, habria fuga de datos entre cuentas.
    # ------------------------------------------------------------------
    Given path 'cart'
    When method get
    Then status 200
    And match response.items == []

    Given path 'cart', 'items'
    And request { productId: '#(producto.id)', quantity: 2 }
    When method post
    Then status 201
    And match response.items == '#[1]'
    And match response.items[0].quantity == 2

    # ------------------------------------------------------------------
    # 4 - Cotiza. Aca estan los oraculos de negocio, y ninguno sale del
    #     codigo bajo prueba: el IVA y el umbral los declara karate-config,
    #     no pricing.js. Si manana alguien cambia el IVA en el codigo y no
    #     en el contrato de negocio, esta prueba lo dice.
    # ------------------------------------------------------------------
    Given path 'orders', 'quote'
    And request {}
    When method post
    Then status 200

    * def subtotal = response.subtotal
    * def ivaEsperado = Math.round(subtotal * reglas.iva)

    And match subtotal == producto.price * 2
    And match response.discount == 0
    And match response.couponApplied == null
    And match response.tax == ivaEsperado
    # El carro supera el umbral, entonces el envio es gratis.
    And match response.shipping == 0
    And match response.total == subtotal + ivaEsperado

    * def totalCotizado = response.total

    # ------------------------------------------------------------------
    # 5 - Paga. El oraculo mas fuerte del viaje: lo que la cotizacion
    #     PROMETIO tiene que ser lo que la orden COBRA. Esa continuidad no
    #     depende de ninguna constante, y es la que de verdad le importa al
    #     negocio: un cliente al que se le cobra distinto de lo que vio es
    #     un reclamo, no un bug menor.
    # ------------------------------------------------------------------
    Given path 'orders', 'checkout'
    And request {}
    When method post
    Then status 201
    And match response.id == '#number'
    And match response.status == 'pagado'
    And match response.total == totalCotizado
    And match response.items == '#[1]'
    And match response.items[0].productId == producto.id

    * def numeroDeOrden = response.id

    # ------------------------------------------------------------------
    # 6 - Despues de pagar el carro queda vacio. Es el efecto secundario
    #     que casi nunca se verifica: si el carro no se vacia, el cliente
    #     compra lo mismo dos veces.
    # ------------------------------------------------------------------
    Given path 'cart'
    When method get
    Then status 200
    And match response.items == []

    # ------------------------------------------------------------------
    # 7 - Y la orden aparece en SU historial. Cierra el viaje: lo que se
    #     escribio se puede volver a leer, que es lo que ninguna prueba de
    #     componente con dobles puede afirmar.
    # ------------------------------------------------------------------
    Given path 'orders'
    When method get
    Then status 200
    And match response == '#[1]'
    And match response[0].id == numeroDeOrden

    Given path 'orders', numeroDeOrden
    When method get
    Then status 200
    And match response.total == totalCotizado
    And match response.items[0].productId == producto.id
