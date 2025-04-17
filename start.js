const { spawn } = require("child_process")
const dotenv = require("dotenv")

// Cargar variables de entorno
dotenv.config()

console.log("🚀 Iniciando aplicación...")

// Verificar la conexión a MongoDB primero
const testConnection = spawn("node", ["scripts/test-connection.js"])

testConnection.stdout.on("data", (data) => {
  console.log(data.toString())
})

testConnection.stderr.on("data", (data) => {
  console.error(data.toString())
})

testConnection.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Conexión a MongoDB verificada, iniciando servidor...")

    // Iniciar el servidor
    const server = spawn("node", ["server.js"], { stdio: "inherit" })

    server.on("close", (serverCode) => {
      console.log(`Servidor cerrado con código ${serverCode}`)
      process.exit(serverCode)
    })
  } else {
    console.log("⚠️ No se pudo conectar a MongoDB, iniciando en modo fallback...")

    // Iniciar el servidor de todos modos (usará almacenamiento en memoria)
    const server = spawn("node", ["server.js"], { stdio: "inherit" })

    server.on("close", (serverCode) => {
      console.log(`Servidor cerrado con código ${serverCode}`)
      process.exit(serverCode)
    })
  }
})
