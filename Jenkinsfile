// ===========================================================================
// EL MISMO PIPELINE, EN JENKINS · clase 12
//
// Este archivo no agrega capacidades: hace exactamente lo mismo que
// .github/workflows/pipeline.yml. Esta aca para una sola cosa, y conviene
// decirla en voz alta en clase:
//
//     El modelo de etapas y gates es independiente de la herramienta.
//
// Lo que cambia entre GitHub Actions y Jenkins es el vocabulario:
//
//   concepto                GitHub Actions          Jenkins
//   ------------------------------------------------------------------
//   etapa                   job                     stage
//   orden                   needs:                  el orden de los stage
//   paralelo                jobs sin needs           parallel { }
//   gate informativo        continue-on-error        catchError(buildResult:
//                                                      'UNSTABLE')
//   limite de tiempo        timeout-minutes          options { timeout() }
//   guardar evidencia       upload-artifact          archiveArtifacts
//   cancelar corridas       concurrency              disableConcurrentBuilds()
//
// Es la misma leccion de la clase 11 con las herramientas de prueba: la
// decision de diseno (que se verifica, en que etapa, que bloquea) vive antes
// de elegir la herramienta. Si alguien reemplaza Jenkins por Actions y su
// estrategia de calidad cambia, no tenia una estrategia: tenia una
// configuracion.
// ===========================================================================

pipeline {
  agent any

  options {
    timeout(time: 40, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  environment {
    NODE_VERSION = '24'
  }

  stages {

    stage('Preparar') {
      steps {
        sh 'node --version'
        sh 'npm ci'
      }
    }

    // -----------------------------------------------------------------------
    // ETAPA 1 · COMMIT — los cinco gates en paralelo, presupuesto 5 minutos
    // -----------------------------------------------------------------------
    stage('1 · Commit') {
      options { timeout(time: 5, unit: 'MINUTES') }
      parallel {

        stage('lint') {
          steps { sh 'npm run lint' }
        }

        stage('unitarias') {
          steps { sh 'npm run test:unitarias' }
        }

        stage('contrato') {
          steps { sh 'npm run test:contrato' }
        }

        stage('SAST (informativo)') {
          steps {
            // catchError con UNSTABLE es el equivalente de continue-on-error:
            // el stage queda marcado, el build sigue, nadie queda bloqueado.
            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
              sh 'pip install --quiet semgrep'
              sh 'semgrep --config=.semgrep/reglas.yml --metrics=off src/'
            }
          }
        }

        stage('dependencias (informativo)') {
          steps {
            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
              sh 'npm run sca'
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // ETAPA 2 · COMPONENTE — con dobles, sin levantar el sistema
    // -----------------------------------------------------------------------
    stage('2 · Componente') {
      options { timeout(time: 15, unit: 'MINUTES') }
      steps {
        sh 'npm run karate -- --tags @componente'
      }
      post {
        always { archiveArtifacts artifacts: 'target/karate-reports/**', allowEmptyArchive: true }
      }
    }

    // -----------------------------------------------------------------------
    // ETAPA 3 · INTEGRACION — aca si se levanta la API real
    // -----------------------------------------------------------------------
    stage('3 · Integracion') {
      options { timeout(time: 20, unit: 'MINUTES') }
      steps {
        sh 'nohup npm run dev > servidor.log 2>&1 &'
        // Esperar por el health check, nunca por un `sleep` fijo.
        sh '''
          for i in $(seq 1 30); do
            curl -sf http://localhost:4000/api/health > /dev/null && exit 0
            sleep 1
          done
          echo "La API no respondio en 30s"; exit 1
        '''
        sh 'npm run karate -- tests/integracion'
      }
      post {
        always {
          archiveArtifacts artifacts: 'target/karate-reports/**', allowEmptyArchive: true
          sh 'pkill -f "node src/server.js" || true'
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // PUERTA — el resultado del build ES la decision
  // -------------------------------------------------------------------------
  post {
    success  { echo 'Puerta abierta: el commit es candidato a publicarse.' }
    unstable { echo 'Puerta abierta con observaciones: algun gate informativo encontro algo.' }
    failure  { echo 'Puerta cerrada: un gate bloqueante no paso.' }
  }
}
