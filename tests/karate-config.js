/*
 * CAPA 1 de la arquitectura de automatizacion: configuracion y ambientes.
 *
 * Karate llama a esta funcion una vez antes de cada feature y deja todo lo que
 * retorna como variables globales. Es el unico lugar del proyecto donde debe
 * aparecer una URL o una credencial: si manana el ambiente cambia, se toca
 * este archivo y ninguno mas.
 *
 * Para apuntar a otro ambiente:
 *   npm run karate -- --karate.env=qa
 */
function fn() {
  const env = karate.env || 'local';

  const config = {
    env: env,

    // --- ambiente ---
    baseUrl: 'http://localhost:4000/api',

    // --- CAPA 2: datos de prueba conocidos (los del seed) ---
    usuarios: {
      cliente: { email: 'cliente@demo.cl', password: 'Demo1234' },
      admin:   { email: 'admin@demo.cl',   password: 'Admin1234' }
    },

    // Los cuatro cupones del seed no son cuatro cualesquiera: son las cuatro
    // clases de equivalencia de la validacion.
    cupones: {
      valido:       'BIENVENIDO10',  // 10%, sin monto minimo
      conMinimo:    'VERANO20',      // 20%, exige subtotal >= 30000
      expirado:     'EXPIRADO',      // vencio en 2020
      inactivo:     'INACTIVO',      // existe pero esta desactivado
      inexistente:  'NO_EXISTE_123'
    },

    // Producto barato: con el, el subtotal queda bajo el minimo de VERANO20
    // y tambien bajo el umbral de envio gratis.
    productos: {
      barato: { id: 9, sku: 'SKU-009', precio: 18990 },  // Sandalias Sport Flex
      caro:   { id: 1, sku: 'SKU-001', precio: 45990 }   // Zapatillas Urban Runner
    },

    // --- reglas de negocio, para no repetir magic numbers en los escenarios ---
    reglas: {
      iva: 0.19,
      envio: 3000,
      umbralEnvioGratis: 30000
    }
  };

  if (env === 'qa') {
    config.baseUrl = 'http://qa.interno:4000/api';
  }

  // --- Ambiente desplegado (certificacion, produccion) ---
  // Si existe la variable de ambiente BASE_URL, gana sobre todo lo anterior.
  // Es asi para que el pipeline pueda apuntar las mismas features al ambiente
  // que acaba de desplegar, sin tocar este archivo ni agregar un env nuevo
  // por cada servidor que aparezca. La regla sigue intacta: la URL se decide
  // en un solo lugar, y ese lugar es este.
  const urlDesplegada = java.lang.System.getenv('BASE_URL');
  if (urlDesplegada) {
    config.baseUrl = urlDesplegada;
    config.remoto = true;
    karate.log('Ambiente desplegado:', urlDesplegada);
  }

  // Timeouts generosos: la primera corrida puede encontrarse el servidor frio.
  // Contra un ambiente desplegado se triplican: un servicio que viene de
  // dormir tarda lo suyo en el primer golpe, y confundir arranque en frio con
  // defecto es la forma mas rapida de volver inestable una prueba que no lo es.
  const espera = config.remoto ? 30000 : 10000;
  karate.configure('connectTimeout', espera);
  karate.configure('readTimeout', espera);

  return config;
}
