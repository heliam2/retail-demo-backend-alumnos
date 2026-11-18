@demo @clase11 @integracion
Feature: Validacion de cupones en la cotizacion del pedido

  # Esta es la feature que se lee en clase. Verifica la regla de negocio mas
  # cara del sistema -el calculo del total- por su API, sin pasar por la interfaz.
  #
  # NIVEL: prueba de INTEGRACION. Todo el stack es real: rutas, repositories,
  # db.js y data.json. No hay ningun doble. Comparar con contra-doble.feature,
  # que verifica lo mismo pero en aislamiento.

  Background:
    * url baseUrl

    # CAPA 2 - datos de prueba.
    # Este bloque corre antes de CADA escenario: todos parten del mismo seed.
    # Sin esto, el primer escenario que agregue algo al carro contamina al resto.
    Given path 'test/reset'
    When method post
    Then status 200

    # CAPA 4 - accion de negocio: iniciar sesion como cliente.
    Given path 'auth/login'
    And request { email: '#(usuarios.cliente.email)', password: '#(usuarios.cliente.password)' }
    When method post
    Then status 200
    * def token = response.token

    # DOS TRAMPAS DE KARATE, las dos en esta misma linea:
    #
    # 1) '* header Authorization = ...' aplica SOLO a la peticion siguiente.
    #    La primera se lo lleva y las demas salen sin token -> 401.
    #    Por eso se usa 'configure headers', que si persiste en el escenario.
    #
    # 2) Una expresion #(...) se evalua solo si ocupa el valor COMPLETO.
    #    Escrita dentro de un texto mas largo, 'Bearer #(token)' viaja
    #    literalmente asi, con el #(token) sin reemplazar -> 401 tambien.
    #    Por eso el 'Bearer ' se concatena antes, en una variable aparte.
    * def authHeader = 'Bearer ' + token
    * configure headers = { Authorization: '#(authHeader)' }


  @humo
  Scenario: Un cupon expirado es rechazado y no altera el total

    # Carro con un solo producto barato.
    Given path 'cart/items'
    And request { productId: '#(productos.barato.id)', quantity: 1 }
    When method post
    Then status 201

    # Primero cotizamos SIN cupon, para tener el total de referencia.
    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    * def totalSinCupon = response.total
    * def subtotal = response.subtotal

    # Ahora con el cupon vencido.
    Given path 'orders/quote'
    And request { couponCode: '#(cupones.expirado)' }
    When method post
    Then status 400
    And match response.error == 'Cupon expirado'

    # La mitad que casi siempre se olvida: comprobar que NO se aplico nada.
    # Sin esta verificacion, un sistema que mostrara el error Y ADEMAS
    # aplicara el descuento pasaria esta prueba en verde. Eso es "The Liar".
    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    And match response.total == totalSinCupon
    And match response.discount == 0
    And match response.couponApplied == null


  Scenario: Un cupon valido descuenta el porcentaje declarado

    Given path 'cart/items'
    And request { productId: '#(productos.barato.id)', quantity: 1 }
    When method post
    Then status 201

    Given path 'orders/quote'
    And request { couponCode: '#(cupones.valido)' }
    When method post
    Then status 200

    # BIENVENIDO10 = 10% sobre el subtotal, redondeado.
    * def esperado = Math.round(response.subtotal * 0.10)
    And match response.discount == esperado
    And match response.couponApplied == cupones.valido

    # El IVA se calcula sobre (subtotal - descuento), no sobre el subtotal.
    * def base = response.subtotal - response.discount
    And match response.tax == Math.round(base * reglas.iva)


  Scenario: El carro vacio no se puede cotizar

    # Sin agregar nada al carro.
    Given path 'orders/quote'
    And request { couponCode: '#(cupones.valido)' }
    When method post
    Then status 400
    And match response.error == 'El carro esta vacio'
