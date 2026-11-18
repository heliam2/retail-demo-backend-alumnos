@demo @clase11 @componente
Feature: Las mismas reglas, pero en aislamiento (contra un doble)

  # LA LECCION DE ESTA FEATURE
  #
  # Compare esta feature con cupones.feature. Verifican lo mismo y estan
  # escritas con la misma herramienta. La unica diferencia esta en una linea:
  # a donde apunta 'url'.
  #
  #   cupones.feature    -> url baseUrl                      -> sistema REAL
  #   contra-doble.feature -> url del servidor de mentira     -> todo DOBLADO
  #
  # Y esa linea cambia el NIVEL de la prueba:
  #
  #   cupones.feature      es una prueba de INTEGRACION
  #   contra-doble.feature es una prueba de COMPONENTE
  #
  # El nivel de una prueba es su LIMITE DE AISLAMIENTO -que dejas real y que
  # reemplazas por un doble-, no la herramienta con la que la escribiste.
  #
  # Consecuencia practica: esta feature NO necesita que el backend este
  # corriendo. Pruebela apagando el servidor; esta pasa igual.

  Background:
    # Karate levanta el doble en un puerto libre y lo apaga al terminar.
    * def server = karate.start({ mock: 'api-mock.feature', port: 0 })
    * url 'http://localhost:' + server.port + '/api'

    # Mismo guion que contra el sistema real: iniciar sesion y llenar el carro.
    Given path 'auth/login'
    And request { email: '#(usuarios.cliente.email)', password: '#(usuarios.cliente.password)' }
    When method post
    Then status 200
    * header Authorization = 'Bearer ' + response.token

    Given path 'cart/items'
    And request { productId: '#(productos.barato.id)', quantity: 1 }
    When method post
    Then status 201


  Scenario: Un cupon expirado es rechazado y no altera el total

    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    * def totalSinCupon = response.total

    Given path 'orders/quote'
    And request { couponCode: '#(cupones.expirado)' }
    When method post
    Then status 400
    And match response.error == 'Cupon expirado'

    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    And match response.total == totalSinCupon


  Scenario Outline: El cupon <codigo> responde <status>, sin backend real

    Given path 'orders/quote'
    And request { couponCode: '<codigo>' }
    When method post
    Then status <status>

    Examples:
      | codigo       | status |
      | BIENVENIDO10 | 200    |
      | VERANO20     | 400    |
      | EXPIRADO     | 400    |
      | INACTIVO     | 400    |


  Scenario: Lo que un doble NO puede verificar

    # Importante decirlo en voz alta: el doble responde lo que nosotros le
    # dijimos que respondiera. Si el calculo real del IVA estuviera mal, esta
    # prueba no se enteraria: solo esta verificando que el consumidor sabe
    # hablar con el contrato.
    #
    # Por eso una suite no puede ser SOLO de componente: el nivel de
    # integracion existe para verificar que las piezas reales calzan.
    Given path 'orders/quote'
    And request {}
    When method post
    Then status 200
    And match response.subtotal == 18990
    And match response ==
      """
      {
        subtotal: '#number',
        discount: '#number',
        couponApplied: '##string',
        tax: '#number',
        shipping: '#number',
        total: '#number',
        error: '##null'
      }
      """
