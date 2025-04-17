const mongoose = require("mongoose")
const fs = require("fs-extra")
const path = require("path")
require("dotenv").config()

async function initializeDatabase() {
  console.log("🚀 Inicializando la base de datos...")

  // Preparar directorios
  const dataDir = process.env.RENDER_PERSISTENT_DIR || path.join(process.cwd(), "data")
  console.log(`Usando directorio de datos: ${dataDir}`)

  // Crear directorio de datos si no existe
  try {
    fs.ensureDirSync(dataDir)
    console.log(`✅ Directorio de datos creado/verificado: ${dataDir}`)
  } catch (error) {
    console.error(`❌ Error al crear directorio de datos: ${error.message}`)
    console.log("⚠️ Continuando sin directorio persistente")
  }

  // Intentar conectar a MongoDB
  const mongoURI =
    process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

  if (!mongoURI) {
    console.warn("⚠️ MONGODB_URI no está configurada, utilizando fallback en memoria")
    return false
  }

  // Intentar distintas estrategias de conexión
  try {
    // Configurar mongoose
    mongoose.set("strictQuery", false)

    // Opciones de conexión según el ejemplo proporcionado
    const clientOptions = {
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }

    console.log("Conectando a MongoDB...")
    await mongoose.connect(mongoURI, clientOptions)
    console.log("✅ Conexión a MongoDB establecida correctamente")

    // Verificar la base de datos
    const admin = mongoose.connection.db.admin()
    await admin.ping()
    console.log("✅ MongoDB responde correctamente")

    // Inicializar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)
    console.log("Colecciones existentes:", collectionNames)

    // Inicializar usuario admin por defecto si no existe
    if (!collectionNames.includes("adminusers")) {
      console.log("Creando colección adminusers...")
      await mongoose.connection.db.createCollection("adminusers")

      // Insertar usuarios admin por defecto
      const adminUsers = [
        { username: "lucas", password: "lucas9244", role: "admin" },
        { username: "angeles", password: "ange1212", role: "admin" },
        { username: "admin", password: "admin123", role: "superadmin" },
      ]

      await mongoose.connection.db.collection("adminusers").insertMany(adminUsers)
      console.log("✅ Usuarios admin inicializados")
    }

    // Cerrar conexión
    await mongoose.disconnect()
    console.log("Conexión cerrada correctamente")

    return true
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error.message)

    // Intentar con conexión alternativa
    try {
      console.log("🔄 Intentando conexión alternativa...")

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
      }

      // Opciones alternativas
      const alternativeOptions = {
        serverApi: { version: "1", strict: false, deprecationErrors: false },
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      }

      await mongoose.connect(mongoURI, alternativeOptions)
      console.log("✅ Conexión alternativa establecida")
      await mongoose.disconnect()

      return true
    } catch (altError) {
      console.error("❌ Error en conexión alternativa:", altError.message)
      console.log("⚠️ La aplicación funcionará con almacenamiento en memoria")
      return false
    }
  }
}

// Auto-ejecutar la inicialización
initializeDatabase()
  .then((success) => {
    console.log(success ? "✅ Inicialización completa" : "⚠️ Inicialización con advertencias")
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error)
    process.exit(1)
  })
