const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const dotenv = require("dotenv")
const mysql = require("mysql2/promise")

// Cargar variables de entorno
dotenv.config()

// Determinar el entorno
const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "localhost"
const port = Number.parseInt(process.env.PORT || "3000", 10)

// Configuración de MySQL
async function setupMySQL() {
  try {
    const config = {
      host: process.env.MYSQL_HOST || "database-1.c9wyu6c8ancu.us-east-2.rds.amazonaws.com",
      port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10),
      user: process.env.MYSQL_USER || "admin",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "blog_teikoku",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000, // 10 seconds timeout
    }

    if (!config.password) {
      console.warn("⚠️ MySQL password not set in environment variables")
      console.warn("⚠️ Application will use in-memory fallback")
      return false
    }

    console.log(`🔄 Connecting to MySQL at ${config.host}:${config.port}...`)

    // Test the connection with a timeout
    const connectionPromise = mysql.createConnection(config)

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), 10000)
    })

    // Race the connection against the timeout
    const connection = await Promise.race([connectionPromise, timeoutPromise])

    console.log("✅ MySQL connection established successfully")

    // Test the connection with a simple query
    const [rows] = await connection.query("SELECT 1 as test")
    console.log("✅ MySQL query executed successfully:", rows)

    // Close the connection
    await connection.end()

    return true
  } catch (error) {
    console.error("❌ Error setting up MySQL:", error.message)
    console.log("⚠️ Application will use in-memory fallback")
    return false
  }
}

// Inicializar la aplicación Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Preparar la aplicación
app
  .prepare()
  .then(async () => {
    // Try to connect to MySQL, but don't fail if it doesn't work
    try {
      await setupMySQL()
    } catch (error) {
      console.error("MySQL setup error:", error)
      console.log("⚠️ Application will use in-memory fallback")
    }

    // Crear el servidor HTTP
    createServer(async (req, res) => {
      try {
        // Parsear la URL
        const parsedUrl = parse(req.url, true)

        // Permitir solicitudes de cualquier origen (CORS)
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")

        // Manejar solicitudes OPTIONS para CORS
        if (req.method === "OPTIONS") {
          res.writeHead(200)
          res.end()
          return
        }

        // Dejar que Next.js maneje la solicitud
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error("Error handling request:", err)
        res.statusCode = 500
        res.end("Internal Server Error")
      }
    })
      .once("error", (err) => {
        console.error("Server error:", err)
        process.exit(1)
      })
      .listen(port, () => {
        const serverUrl = `http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`
        console.log(`> Ready on ${serverUrl}`)

        // Mostrar información del entorno
        console.log(`> Environment: ${process.env.NODE_ENV}`)
        console.log(`> MySQL: ${process.env.MYSQL_HOST ? "Configured" : "Not configured (using memory fallback)"}`)

        // Detectar plataforma de hosting
        if (process.env.VERCEL) {
          console.log("> Detected Vercel deployment")
        } else if (process.env.RENDER) {
          console.log("> Detected Render deployment")
        } else {
          console.log("> Running on custom server")
        }
      })
  })
  .catch((err) => {
    console.error("Error preparing the app:", err)
    process.exit(1)
  })

// Manejo de cierre limpio
process.on("SIGINT", async () => {
  console.log("Servidor detenido correctamente")
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("Servidor detenido correctamente")
  process.exit(0)
})
