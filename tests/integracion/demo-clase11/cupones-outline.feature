@demo @clase11 @integracion
Feature: Los cuatro estados de un cupon, con una sola mecanica

  # Este es el patron que hace que valga la pena Karate: UNA mecanica y MUCHOS
  # datos. Agregar un quinto caso manana cuesta una linea de la tabla, no un
  # escenario nuevo.
  #
  # Los cuatro cupones del seed son exactamente las cuatro clases de
  # equivalencia de la validacion:
  #
  #   BIENVENIDO10  valido, sin monto minimo          -> 200
  #   VERANO20      valido, pero exige subtotal 30000 -> 400 (el carro no llega)
  #   EXPIRADO      vencio en 2020                    -> 400
  #   INACTIVO      existe pero esta desactivado      -> 400
  #
  # OJO con el carro: usamos el producto barato (SKU-009, $18.990) a proposito.
  # Con el producto caro ($45.990) el subtotal superaria los $30.000 y VERANO20
  # pasaria a ser valido, con lo que se perderia esa clase de equivalencia.

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

    # OJO, y es una trampa clasica de Karate:
    #   * header Authorization = ...   aplica SOLO a la peticion siguiente
    #   * configure headers = { ... }  aplica a TODAS las que vengan
    # Con 'header', la primera peticion se lo lleva y las demas salen sin token:
    # el servidor responde 401 y el escenario falla sin que haya defecto real.
    * configure headers = { Authorization: 'Bearer #(token)' }

    # Carro por debajo del minimo de VERANO20 y del umbral de envio gratis.
    Given path 'cart/items'
    And request { productId: '#(productos.barato.id)', quantity: 1 }
    When method post
    Then status 201


  Scenario Outline: El cupon <codigo> responde <status>

    Given path 'orders/quote'
    And request { couponCode: '<codigo>' }
    When method post
    Then status <status>
    And match response.error == <error>

    Examples:
      | codigo       | status | error                                      | nota                                 |
      | BIENVENIDO10 | 200    | null                                       | valido, sin monto minimo             |
      | VERANO20     | 400    | 'El monto minimo para este cupon es $30000'| valido, pero el carro no llega       |
      | EXPIRADO     | 400    | 'Cupon expirado'                           | vencio en 2020                       |
      | INACTIVO     | 400    | 'Cupon inactivo'                           | existe pero esta desactivado         |
      | NO_EXISTE_1  | 400    | 'Cupon no existe'                          | quinto caso: cuesta una sola linea   |


  Scenario: El envio es gratis desde los 30.000 y se cobra justo por debajo

    # Valores limite: el umbral es 30000 y el producto barato vale 18990.
    # Con 1 unidad el subtotal es 18990  -> paga envio
    # Con 2 unidades el subtotal es 37980 -> envio gratis
    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    And match response.subtotal == 18990
    And match response.shipping == reglas.envio

    Given path 'cart/items'
    And request { productId: '#(productos.barato.id)', quantity: 1 }
    When method post
    Then status 201

    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    And match response.subtotal == 37980
    And match response.shipping == 0
