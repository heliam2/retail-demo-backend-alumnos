@demo @clase11
Feature: Doble de prueba de la API de ChileRetail

  # Esto NO es una prueba: es un SERVIDOR. Karate trae la capacidad de mock
  # incorporada, sin libreria adicional, y los mocks se escriben en el mismo
  # Gherkin que las pruebas.
  #
  # Como se lee: cada Scenario tiene en su descripcion un matcher JavaScript.
  # Karate recorre los escenarios en orden y responde con el PRIMERO que calce.
  # Por eso el orden importa: los casos especificos van antes que el general.
  #
  # Para que sirve en clase: lo usa contra-doble.feature para verificar las
  # mismas reglas SIN levantar el backend real. Ese cambio -de sistema real a
  # doble- es lo que convierte una prueba de integracion en una de componente.

  Background:
    * def tokenFalso = 'token-de-mentira-para-la-demo'

    # Totales de referencia: 1 x SKU-009 ($18.990), sin cupon.
    # subtotal 18990 - descuento 0 = 18990 ; IVA 19% = 3608 ; envio 3000
    * def totalesSinCupon =
      """
      {
        subtotal: 18990,
        discount: 0,
        couponApplied: null,
        tax: 3608,
        shipping: 3000,
        total: 25598,
        error: null
      }
      """

  # --- sesion ---------------------------------------------------------------

  Scenario: pathMatches('/api/auth/login') && methodIs('post')
    * def response = { token: '#(tokenFalso)', user: { id: 1, email: 'cliente@demo.cl', name: 'Cliente Demo' } }
    * def responseStatus = 200

  # --- carro ----------------------------------------------------------------

  Scenario: pathMatches('/api/cart/items') && methodIs('post')
    * def response = { items: [{ productId: 9, quantity: 1, price: 18990 }] }
    * def responseStatus = 201

  # --- cotizacion: primero los casos de error, despues el camino feliz -------

  Scenario: pathMatches('/api/orders/quote') && request.couponCode == 'EXPIRADO'
    * def response = { error: 'Cupon expirado' }
    * def responseStatus = 400

  Scenario: pathMatches('/api/orders/quote') && request.couponCode == 'INACTIVO'
    * def response = { error: 'Cupon inactivo' }
    * def responseStatus = 400

  Scenario: pathMatches('/api/orders/quote') && request.couponCode == 'VERANO20'
    * def response = { error: 'El monto minimo para este cupon es $30000' }
    * def responseStatus = 400

  Scenario: pathMatches('/api/orders/quote') && request.couponCode == 'BIENVENIDO10'
    * def descuento = 1899
    * def base = 18990 - descuento
    * def response =
      """
      {
        subtotal: 18990,
        discount: '#(descuento)',
        couponApplied: 'BIENVENIDO10',
        tax: '#(Math.round(base * 0.19))',
        shipping: 3000,
        total: '#(base + Math.round(base * 0.19) + 3000)',
        error: null
      }
      """
    * def responseStatus = 200

  # Sin cupon (o con uno que no conocemos): devolvemos los totales base.
  Scenario: pathMatches('/api/orders/quote') && methodIs('post')
    * def response = totalesSinCupon
    * def responseStatus = 200

  # --- cualquier otra cosa --------------------------------------------------

  Scenario:
    * def response = { error: 'El doble no implementa esta ruta: ' + requestUri }
    * def responseStatus = 404
