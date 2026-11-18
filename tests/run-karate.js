#! /usr/bin/env node
/*
 * Lanzador de Karate para este proyecto.
 *
 * Por que existe este archivo:
 *   @karatelabs/karate no trae un binario propio: expone un modulo que arma la
 *   invocacion de jbang. Ademas, su valor por defecto karate.version = 'LATEST'
 *   apunta a un jar "-all" que ya no se publica en Maven Central desde la 2.0.0,
 *   asi que hay que fijar una version que si exista. La ultima es 1.5.2.
 *
 * La primera corrida descarga jbang y el jar de Karate: puede tardar un par de
 * minutos. Las siguientes son inmediatas.
 *
 * Uso (siempre desde la raiz del repositorio):
 *   npm run karate                         -> corre todas las features de tests/
 *   npm run karate -- tests/integracion    -> corre solo un nivel
 *   npm run karate -- --tags @componente   -> filtra por etiqueta
 */

const karate = require('@karatelabs/karate');

// Ultima version con el jar "-all" publicado en Maven Central.
karate.version = '1.5.2';

// Carpeta donde vive karate-config.js (relativa a la raiz del repositorio).
karate.config.dir = 'tests';

// Si no se paso ningun argumento, corre la demo de la clase 11.
// karate.exec() concatena por su cuenta lo que venga en process.argv.
const hayArgumentos = process.argv.slice(2).length > 0;
karate.exec(hayArgumentos ? '' : 'tests');
