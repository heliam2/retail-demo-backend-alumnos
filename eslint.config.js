/*
 * GATE DE LINT · clase 12
 *
 * El lint es el gate mas barato del pipeline: no ejecuta el programa, solo lo
 * lee. Por eso tarda segundos y va primero.
 *
 * Las reglas de abajo NO son de estilo. El estilo (comillas, punto y coma,
 * indentacion) se discute eternamente y no encuentra defectos; eso es trabajo
 * de un formateador, no de un gate. Las que estan aca detectan codigo que
 * probablemente este mal:
 *
 *   no-unused-vars        una variable que nadie usa suele ser un olvido
 *   no-undef              un nombre que no existe: error en tiempo de ejecucion
 *   no-dupe-keys          { a: 1, a: 2 } -> el primero se pierde en silencio
 *   no-unreachable        codigo despues de un return: nunca corre
 *   require-atomic-updates condicion de carrera al escribir tras un await
 *   no-constant-condition if (true) que quedo de una depuracion
 *
 * Varias de esas son defectos reales que ninguna prueba unitaria encuentra,
 * porque la prueba solo mira lo que decidiste probar y el lint mira todo.
 */

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        // Globales que Jest inyecta en los archivos de prueba.
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^(next|req|res)$" }],
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "require-atomic-updates": "error",
      "no-self-compare": "error",
      // Advertencia, no error: un console.log olvidado no justifica detener
      // el pipeline. Buen ejemplo de gate informativo frente a gate bloqueante.
      "no-console": "warn",
    },
  },
  {
    /*
     * FALSO POSITIVO, y vale la pena mirarlo.
     *
     * karate-config.js no lo ejecuta Node: lo ejecuta Karate, que le inyecta
     * `karate` y lo invoca como una funcion. Para ESLint eso es una variable
     * inexistente y una funcion sin usar, asi que reportaba cuatro errores que
     * no son defectos.
     *
     * Asi se ve el trabajo real de mantener un gate: casi todo gate nuevo
     * empieza con ruido, y el ruido se corrige declarando el contexto, nunca
     * apagando la regla para todo el proyecto. Un gate con falsos positivos se
     * deja de leer, y un gate que no se lee no es un gate.
     */
    files: ["tests/karate-config.js"],
    // `java` tambien lo inyecta Karate: su motor de JS corre sobre la JVM y
    // deja alcanzable el arbol de clases de Java. Lo usamos para leer una
    // variable de ambiente (java.lang.System.getenv) y para el reloj.
    languageOptions: { globals: { karate: "readonly", java: "readonly" } },
    rules: { "no-unused-vars": "off" },
  },
  {
    // El reporte de Karate y las dependencias no son nuestro codigo.
    ignores: ["node_modules/**", "target/**", "data.json"],
  },
];
