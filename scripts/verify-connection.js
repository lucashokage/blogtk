const mongoose = require("mongoose")
require("dotenv").config()

async function verifyConnection() {
  console.log("🔍 Verificando conexión a MongoDB...")

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn("⚠️ MONGODB_URI no está configurada")
    console.log("⚠️ La aplicación funcionará con almacenamiento en memoria")
    process.exit(0)
  }

  // Limpiar URI
  const cleanUri = uri.replace(/<|>/g, "")

  try {
    // Configurar mongoose
    mongoose.set("strictQuery", false)

    // Opciones de conexión optimizadas para conexión directa
    const options = {
      directConnection: true,
      ssl: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
    }

    console.log("Conectando a MongoDB...")
    await mongoose.connect(cleanUri, options)

    console.log("✅ Conexión a MongoDB verificada correctamente")

    // Verificar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log(`Colecciones disponibles: ${collections.map((c) => c.name).join(", ")}`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error al verificar conexión:", error.message)
    console.log("⚠️ La aplicación funcionará con almacenamiento en memoria")
    process.exit(0) // Salir con código 0 para no interrumpir el despliegue
  }
}

verifyConnection()
